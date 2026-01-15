import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/* ================= HELPERS ================= */
function n(v: any, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function computeOutstanding(r: any) {
  // Prefer stored balanceAmt
  const bal =
    r.balanceAmt !== null && r.balanceAmt !== undefined ? n(r.balanceAmt, 0) : null;
  if (bal !== null) return bal;

  // Compute total if totalAmt missing
  const qty = n(r.qty, 0);
  const rate = n(r.rate, 0);
  const base = qty * rate;

  // royaltyAmt may be stored OR derived from royaltyQty * royaltyRate
  const royaltyAmt =
    r.royaltyAmt !== null && r.royaltyAmt !== undefined
      ? n(r.royaltyAmt, 0)
      : n(r.royaltyQty, 0) * n(r.royaltyRate, 0);

  // taxAmt may be stored OR derived from gstPercent
  const gstPercent = n(r.gstPercent, 0);
  const taxAmt =
    r.taxAmt !== null && r.taxAmt !== undefined
      ? n(r.taxAmt, 0)
      : ((base + royaltyAmt) * gstPercent) / 100;

  const total =
    r.totalAmt !== null && r.totalAmt !== undefined
      ? n(r.totalAmt, 0)
      : base + royaltyAmt + taxAmt;

  const payment = n(r.paymentAmt, 0);

  return total - payment;
}

function isStaffType(typeName?: string | null) {
  const t = String(typeName || "").toUpperCase();
  return t === "STAFF" || t === "SUPERVISOR" || t.includes("STAFF") || t.includes("SUPERVISOR");
}

function isMaterialSupplierType(typeName?: string | null) {
  const t = String(typeName || "").toUpperCase();
  return t === "MATERIAL_SUPPLIER" || t.includes("MATERIAL") || t.includes("SUPPLIER");
}

/* =================================================
   GET ALL LEDGERS
   GET /api/ledgers
================================================= */
export const getLedgers = async (_req: Request, res: Response) => {
  try {
    const data: any[] = await prisma.ledger.findMany({
      where: { isDeleted: false },
      include: {
        ledgerType: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    /* ==========================================
       1) MATERIAL_SUPPLIER: balance from MaterialSupplierLedger
    ========================================== */
    const supplierLedgers = data.filter((l) => isMaterialSupplierType(l?.ledgerType?.name));
    if (supplierLedgers.length) {
      const supplierIds = supplierLedgers.map((l) => l.id);

      const rows = await prisma.materialSupplierLedger.findMany({
        where: { ledgerId: { in: supplierIds } },
        select: {
          ledgerId: true,
          siteId: true,
          qty: true,
          rate: true,
          royaltyQty: true,
          royaltyRate: true,
          royaltyAmt: true,
          gstPercent: true,
          taxAmt: true,
          totalAmt: true,
          paymentAmt: true,
          balanceAmt: true,
        },
      });

      const overallMap: Record<string, number> = {};
      const siteMap: Record<string, number> = {};

      for (const r of rows as any[]) {
        const out = computeOutstanding(r);
        overallMap[r.ledgerId] = (overallMap[r.ledgerId] || 0) + out;

        const key = `${r.ledgerId}__${r.siteId || ""}`;
        siteMap[key] = (siteMap[key] || 0) + out;
      }

      for (const l of data) {
        if (!isMaterialSupplierType(l?.ledgerType?.name)) continue;

        const siteKey = `${l.id}__${l.siteId || ""}`;
        const siteSum = siteMap[siteKey];
        const allSum = overallMap[l.id] ?? 0;

        // Prefer site-wise if available; else fallback to overall
        l.closingBalance = siteSum !== undefined ? siteSum : allSum;
      }
    }

    /* ==========================================
       2) STAFF / SUPERVISOR: balance from StaffExpense
       Balance = SUM(inAmount) - SUM(outAmount)
    ========================================== */
    const staffLedgers = data.filter((l) => isStaffType(l?.ledgerType?.name));
    if (staffLedgers.length) {
      const staffIds = staffLedgers.map((l) => l.id);

      const grouped = await prisma.staffExpense.groupBy({
        by: ["staffLedgerId"],
        where: { staffLedgerId: { in: staffIds } },
        _sum: {
          inAmount: true,
          outAmount: true,
        },
      });

      const staffMap: Record<string, number> = {};
      for (const g of grouped as any[]) {
        const sumIn = n(g?._sum?.inAmount, 0);
        const sumOut = n(g?._sum?.outAmount, 0);
        staffMap[g.staffLedgerId] = sumIn - sumOut;
      }

      for (const l of data) {
        if (!isStaffType(l?.ledgerType?.name)) continue;
        l.closingBalance = staffMap[l.id] ?? 0;
      }
    }

    /* ==========================================
       ✅ 3) PAYMENT ENTRY ADJUSTMENT (NEW)
       finalBalance = closingBalance - SUM(PaymentEntry.amount)
       (ledgerId-wise, no site filter because table has no siteId)
    ========================================== */
    if (data.length) {
      const allLedgerIds = data.map((l) => l.id);

      const paymentGrouped = await prisma.paymentEntry.groupBy({
        by: ["ledgerId"],
        where: { ledgerId: { in: allLedgerIds } },
        _sum: { amount: true },
      });

      const payMap: Record<string, number> = {};
      for (const p of paymentGrouped as any[]) {
        payMap[p.ledgerId] = n(p?._sum?.amount, 0);
      }

      for (const l of data) {
        const baseBal = n(l?.closingBalance, 0);
        const paid = payMap[l.id] ?? 0;
        l.closingBalance = baseBal - paid;
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET LEDGERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ledgers",
    });
  }
};

/* =================================================
   GET LEDGER BY ID
   GET /api/ledgers/:id
================================================= */
export const getLedgerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ledger id is required",
      });
    }

    const data: any = await prisma.ledger.findFirst({
      where: { id, isDeleted: false },
      include: {
        ledgerType: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true } },
      },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found",
      });
    }

    // MATERIAL_SUPPLIER: compute balance
    if (isMaterialSupplierType(data?.ledgerType?.name)) {
      const rows = await prisma.materialSupplierLedger.findMany({
        where: { ledgerId: data.id },
        select: {
          ledgerId: true,
          siteId: true,
          qty: true,
          rate: true,
          royaltyQty: true,
          royaltyRate: true,
          royaltyAmt: true,
          gstPercent: true,
          taxAmt: true,
          totalAmt: true,
          paymentAmt: true,
          balanceAmt: true,
        },
      });

      let overall = 0;
      let siteWise: number | undefined = undefined;

      for (const r of rows as any[]) {
        const out = computeOutstanding(r);
        overall += out;

        // same preference logic (if siteId is set on ledger)
        if (data.siteId && String(r.siteId || "") === String(data.siteId)) {
          siteWise = (siteWise ?? 0) + out;
        }
      }

      data.closingBalance = siteWise !== undefined ? siteWise : overall;
    }

    // STAFF/SUPERVISOR: compute balance from staffExpense (ignore site)
    if (isStaffType(data?.ledgerType?.name)) {
      const agg = await prisma.staffExpense.aggregate({
        where: { staffLedgerId: data.id },
        _sum: { inAmount: true, outAmount: true },
      });

      const sumIn = n(agg?._sum?.inAmount, 0);
      const sumOut = n(agg?._sum?.outAmount, 0);
      data.closingBalance = sumIn - sumOut;
    }

    /* ==========================================
       ✅ PAYMENT ENTRY ADJUSTMENT (NEW)
       finalBalance = closingBalance - SUM(PaymentEntry.amount)
    ========================================== */
    const payAgg = await prisma.paymentEntry.aggregate({
      where: { ledgerId: data.id },
      _sum: { amount: true },
    });
    const paid = n(payAgg?._sum?.amount, 0);
    data.closingBalance = n(data?.closingBalance, 0) - paid;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET LEDGER BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ledger",
    });
  }
};

/* =================================================
   CREATE LEDGER
================================================= */
export const createLedger = async (req: Request, res: Response) => {
  try {
    const {
      ledgerTypeId,
      siteId,
      name,
      address,
      mobile,
      openingBalance,
      closingBalance,
      remark,
    } = req.body;

    if (!ledgerTypeId || !name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type and Ledger Name are required",
      });
    }

    const data = await prisma.ledger.create({
      data: {
        ledgerTypeId,
        siteId: siteId || null,
        name: String(name).trim(),
        address: address || null,
        mobile: mobile || null,
        openingBalance:
          openingBalance !== undefined &&
          openingBalance !== null &&
          openingBalance !== ""
            ? String(openingBalance)
            : null,
        closingBalance:
          closingBalance !== undefined &&
          closingBalance !== null &&
          closingBalance !== ""
            ? String(closingBalance)
            : null,
        remark: remark || null,
      },
      include: {
        ledgerType: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true } },
      },
    });

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("CREATE LEDGER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger create failed",
    });
  }
};

/* =================================================
   UPDATE LEDGER
================================================= */
export const updateLedger = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ledger id is required",
      });
    }

    const {
      ledgerTypeId,
      siteId,
      name,
      address,
      mobile,
      openingBalance,
      closingBalance,
      remark,
    } = req.body;

    if (!ledgerTypeId || !name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type and Ledger Name are required",
      });
    }

    const exists = await prisma.ledger.findFirst({
      where: { id, isDeleted: false },
      select: { id: true },
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found",
      });
    }

    const data = await prisma.ledger.update({
      where: { id },
      data: {
        ledgerTypeId,
        siteId: siteId || null,
        name: String(name).trim(),
        address: address || null,
        mobile: mobile || null,
        openingBalance:
          openingBalance !== undefined &&
          openingBalance !== null &&
          openingBalance !== ""
            ? String(openingBalance)
            : null,
        closingBalance:
          closingBalance !== undefined &&
          closingBalance !== null &&
          closingBalance !== ""
            ? String(closingBalance)
            : null,
        remark: remark || null,
      },
      include: {
        ledgerType: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data,
      message: "Ledger updated successfully",
    });
  } catch (error) {
    console.error("UPDATE LEDGER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger update failed",
    });
  }
};

/* =================================================
   DELETE LEDGER (SOFT DELETE)
================================================= */
export const deleteLedger = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ledger id is required",
      });
    }

    await prisma.ledger.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ledger deleted successfully",
    });
  } catch (error) {
    console.error("DELETE LEDGER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger delete failed",
    });
  }
};
