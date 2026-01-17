import { Request, Response } from "express";
import prisma from "../../lib/prisma";

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const rowTotal = (r: any) => {
  // prefer DB totalAmt else qty*rate
  const t = r?.totalAmt;
  if (t !== null && t !== undefined && !Number.isNaN(Number(t))) return n(t);
  return n(r?.qty) * n(r?.rate);
};

export const getSiteProfit = async (_req: Request, res: Response) => {
  try {
    /**
     * HARD DELETE MODE:
     * - No isDeleted filters anywhere.
     */

    // 1) Base sites (with department + status)
    const sites = await prisma.site.findMany({
      include: {
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const siteIds = sites.map((s) => s.id);

    // 2) Expense sum from SiteExpense (manual only)
    const siteExpenseAgg = await prisma.siteExpense.groupBy({
      by: ["siteId"],
      _sum: { amount: true },
    });

    const expenseMap = new Map<string, number>();
    for (const r of siteExpenseAgg) {
      if (!r.siteId) continue;
      expenseMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 3) ✅ AUTO Material cost from MaterialSupplierLedger (qty*rate OR totalAmt)
    const matRows = await prisma.materialSupplierLedger.findMany({
      where: {
        siteId: { in: siteIds },
      },
      select: {
        siteId: true,
        qty: true,
        rate: true,
        totalAmt: true,
      },
    } as any);

    const materialCostMap = new Map<string, number>();
    for (const r of matRows) {
      if (!r.siteId) continue;
      const prev = materialCostMap.get(r.siteId) || 0;
      materialCostMap.set(r.siteId, prev + rowTotal(r));
    }

    // 4) ✅ Labour Contractor cost from LabourPayment (site wise sum)
    // (Model name assumed: labourPayment based on your earlier schema/migration)
    const labourAgg = await prisma.labourPayment.groupBy({
      by: ["siteId"],
      where: {
        siteId: { in: siteIds },
      },
      _sum: { amount: true },
    });

    const labourCostMap = new Map<string, number>();
    for (const r of labourAgg) {
      if (!r.siteId) continue;
      labourCostMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 5) Received sum from SiteReceipt
    const siteReceiptAgg = await prisma.siteReceipt.groupBy({
      by: ["siteId"],
      _sum: { amount: true },
    });

    const receiptMap = new Map<string, number>();
    for (const r of siteReceiptAgg) {
      if (!r.siteId) continue;
      receiptMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 6) Voucher received sum (chequeAmt)
    const voucherAgg = await prisma.voucher.groupBy({
      by: ["siteId"],
      _sum: { chequeAmt: true },
    });

    const voucherMap = new Map<string, number>();
    for (const r of voucherAgg) {
      if (!r.siteId) continue;
      voucherMap.set(r.siteId, Number(r._sum.chequeAmt || 0));
    }

    // 7) Staff IN sum (only those linked to a site)
    const staffInAgg = await prisma.staffExpense.groupBy({
      by: ["siteId"],
      where: {
        siteId: { not: null },
        inAmount: { not: null },
      },
      _sum: { inAmount: true },
    });

    const staffInMap = new Map<string, number>();
    for (const r of staffInAgg) {
      if (!r.siteId) continue;
      staffInMap.set(r.siteId, Number(r._sum.inAmount || 0));
    }

    // 8) Staff OUT rows NOT mirrored into SiteExpense yet
    // (Assumes relation staffExpense -> siteExpense exists; same as your existing logic)
    const unMirroredStaffOut = await prisma.staffExpense.findMany({
      where: {
        siteId: { not: null },
        outAmount: { not: null },
        siteExpense: { is: null }, // only those not mirrored
      },
      select: { siteId: true, outAmount: true },
    });

    const staffOutUnmirroredMap = new Map<string, number>();
    for (const r of unMirroredStaffOut) {
      if (!r.siteId) continue;
      const prev = staffOutUnmirroredMap.get(r.siteId) || 0;
      staffOutUnmirroredMap.set(r.siteId, prev + Number(r.outAmount || 0));
    }

    // 9) Build response rows
    const rows = sites.map((s) => {
      const siteId = s.id;

      // ✅ expenses = manual SiteExpense + (unmirrored staff out) + AUTO material + AUTO labour payments
      const expenses =
        (expenseMap.get(siteId) || 0) +
        (staffOutUnmirroredMap.get(siteId) || 0) +
        (materialCostMap.get(siteId) || 0) +
        (labourCostMap.get(siteId) || 0);

      const amountReceived =
        (receiptMap.get(siteId) || 0) +
        (voucherMap.get(siteId) || 0) +
        (staffInMap.get(siteId) || 0);

      const profit = amountReceived - expenses;

      return {
        siteId,
        department: s.department?.name || "",
        siteName: s.siteName,
        expenses,
        amountReceived,
        profit,
        status: s.status,

        // optional debug / UI usage
        materialPurchaseCost: materialCostMap.get(siteId) || 0,
        labourContractorCost: labourCostMap.get(siteId) || 0,
      };
    });

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (e) {
    console.error("SITE PROFIT ERROR:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site profit",
      data: [],
    });
  }
};
