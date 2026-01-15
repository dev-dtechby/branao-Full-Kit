import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/* ================= HELPERS ================= */
const getDayRange = (d: Date) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);

  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getLedgerName = async (ledgerId: string) => {
  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    select: { name: true },
  });
  return ledger?.name || "";
};

// Legacy matching (fallback)
const findMatchingSiteExpense = async (params: {
  siteId: string;
  expenseDate: Date;
  expenseTitle: string;
  paymentDetails: string; // staff ledger name
  amount: number;
}) => {
  const { siteId, expenseDate, expenseTitle, paymentDetails, amount } = params;
  const { start, end } = getDayRange(expenseDate);

  return prisma.siteExpense.findFirst({
    where: {
      isDeleted: false,
      siteId,
      expenseTitle,
      paymentDetails,
      amount,
      expenseDate: { gte: start, lte: end },
    },
    orderBy: { createdAt: "desc" },
  });
};

const n = (v: any, fallback = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

/**
 * ✅ IMPORTANT:
 * Staff ledger balance must be computed as:
 * SUM(inAmount) - SUM(outAmount) across ALL staffExpense rows (ignore siteId)
 */
const recomputeAndSyncStaffLedgerBalance = async (staffLedgerId: string) => {
  const agg = await prisma.staffExpense.aggregate({
    where: { staffLedgerId },
    _sum: { inAmount: true, outAmount: true },
  });

  const sumIn = n(agg?._sum?.inAmount, 0);
  const sumOut = n(agg?._sum?.outAmount, 0);
  const balance = sumIn - sumOut;

  // store in Ledger.closingBalance for quick UI
  await prisma.ledger.update({
    where: { id: staffLedgerId },
    data: {
      closingBalance: String(balance),
    },
  });

  return balance;
};

/* ======================================================
   CREATE STAFF EXPENSE / RECEIPT (OUT + IN)
====================================================== */
export const createStaffExpense = async (req: Request, res: Response) => {
  try {
    const {
      staffLedgerId,
      siteId,
      expenseDate,
      expenseTitle,
      summary,
      remark,
      outAmount,
      inAmount,
    } = req.body;

    /* ================= VALIDATION ================= */
    if (!staffLedgerId || !expenseTitle || (!outAmount && !inAmount)) {
      return res.status(400).json({
        success: false,
        message: "staffLedgerId, expenseTitle and amount (out/in) are required",
      });
    }

    if (outAmount && inAmount) {
      return res.status(400).json({
        success: false,
        message: "Only one of outAmount or inAmount is allowed",
      });
    }

    const parsedOut =
      outAmount !== undefined && outAmount !== null ? Number(outAmount) : null;
    const parsedIn =
      inAmount !== undefined && inAmount !== null ? Number(inAmount) : null;

    if (
      (parsedOut !== null && isNaN(parsedOut)) ||
      (parsedIn !== null && isNaN(parsedIn))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount value",
      });
    }

    if (parsedOut !== null && parsedOut <= 0) {
      return res.status(400).json({
        success: false,
        message: "outAmount must be greater than 0",
      });
    }
    if (parsedIn !== null && parsedIn <= 0) {
      return res.status(400).json({
        success: false,
        message: "inAmount must be greater than 0",
      });
    }

    /* ================= CHECK LEDGER ================= */
    const staffLedger = await prisma.ledger.findUnique({
      where: { id: staffLedgerId },
      select: { id: true, name: true },
    });

    if (!staffLedger) {
      return res.status(404).json({
        success: false,
        message: "Staff ledger not found",
      });
    }

    /* ================= BUILD DATA ================= */
    const finalDate = expenseDate ? new Date(expenseDate) : new Date();

    const data: any = {
      staffLedger: { connect: { id: staffLedgerId } },
      expenseDate: finalDate,
      expenseTitle,
      summary: summary || null,
      remark: remark || null,
      outAmount: parsedOut,
      inAmount: parsedIn,
    };

    if (siteId) {
      data.site = { connect: { id: siteId } };
    }

    /* ================= CREATE STAFF EXPENSE ================= */
    const staffExpense = await prisma.staffExpense.create({ data });

    /* ================= CREATE SITE EXPENSE (ONLY FOR OUT) ================= */
    if (parsedOut && siteId) {
      await prisma.siteExpense.create({
        data: {
          site: { connect: { id: siteId } },
          expenseDate: finalDate,
          expenseTitle,
          summary: summary || expenseTitle,
          paymentDetails: staffLedger.name,
          amount: parsedOut,

          // ✅ relation connect
          staffExpense: { connect: { id: staffExpense.id } },
        },
      });
    }

    // ✅ sync staff ledger balance (overall)
    const balance = await recomputeAndSyncStaffLedgerBalance(staffLedgerId);

    return res.json({
      success: true,
      message: "Staff expense created successfully",
      data: staffExpense,
      ledgerBalance: balance,
    });
  } catch (error) {
    console.error("CREATE STAFF EXPENSE ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Staff expense save failed",
    });
  }
};

/* ======================================================
   GET STAFF LEDGER ENTRIES
====================================================== */
export const getStaffLedgerEntries = async (req: Request, res: Response) => {
  try {
    const { staffLedgerId } = req.query;

    if (!staffLedgerId || typeof staffLedgerId !== "string") {
      return res.status(400).json({
        success: false,
        message: "staffLedgerId is required",
      });
    }

    const entries = await prisma.staffExpense.findMany({
      where: { staffLedgerId },
      include: {
        site: { select: { siteName: true } },
      },
      orderBy: { expenseDate: "asc" },
    });

    // ✅ also return current computed balance (optional, UI can use later)
    const agg = await prisma.staffExpense.aggregate({
      where: { staffLedgerId },
      _sum: { inAmount: true, outAmount: true },
    });
    const balance = n(agg?._sum?.inAmount, 0) - n(agg?._sum?.outAmount, 0);

    return res.json({
      success: true,
      data: entries,
      balance,
    });
  } catch (error) {
    console.error("GET STAFF LEDGER ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff ledger entries",
    });
  }
};

/* ======================================================
   UPDATE STAFF EXPENSE / RECEIPT
   (Sync SiteExpense if it exists)
====================================================== */
export const updateStaffExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      expenseDate,
      siteId,
      expenseTitle,
      summary,
      remark,
      outAmount,
      inAmount,
    } = req.body;

    if (!id || !expenseTitle) {
      return res.status(400).json({
        success: false,
        message: "Expense id and title are required",
      });
    }

    if (outAmount && inAmount) {
      return res.status(400).json({
        success: false,
        message: "Only one of outAmount or inAmount is allowed",
      });
    }

    const existing = await prisma.staffExpense.findUnique({
      where: { id },
      select: {
        id: true,
        staffLedgerId: true,
        siteId: true,
        expenseDate: true,
        expenseTitle: true,
        summary: true,
        remark: true,
        outAmount: true,
        inAmount: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Staff expense entry not found",
      });
    }

    const parsedOut =
      outAmount !== undefined && outAmount !== null ? Number(outAmount) : null;
    const parsedIn =
      inAmount !== undefined && inAmount !== null ? Number(inAmount) : null;

    if (
      (parsedOut !== null && isNaN(parsedOut)) ||
      (parsedIn !== null && isNaN(parsedIn))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount value",
      });
    }

    if (parsedOut !== null && parsedOut <= 0) {
      return res.status(400).json({
        success: false,
        message: "outAmount must be greater than 0",
      });
    }
    if (parsedIn !== null && parsedIn <= 0) {
      return res.status(400).json({
        success: false,
        message: "inAmount must be greater than 0",
      });
    }

    const finalDate = expenseDate ? new Date(expenseDate) : existing.expenseDate;

    const ledgerName = await getLedgerName(existing.staffLedgerId);

    // ✅ BEST: direct link by staffExpenseId
    let mirror = await prisma.siteExpense.findFirst({
      where: { staffExpenseId: id },
    });

    // fallback legacy matching
    const oldOut = existing.outAmount != null ? Number(existing.outAmount) : null;
    if (!mirror && oldOut && existing.siteId && ledgerName) {
      mirror = await findMatchingSiteExpense({
        siteId: existing.siteId,
        expenseDate: existing.expenseDate,
        expenseTitle: existing.expenseTitle,
        paymentDetails: ledgerName,
        amount: oldOut,
      });
    }

    const data: any = {
      expenseDate: finalDate,
      expenseTitle,
      summary: summary ?? null,
      remark: remark ?? null,
      outAmount: parsedOut,
      inAmount: parsedIn,
    };

    if (siteId) data.site = { connect: { id: siteId } };
    else data.site = { disconnect: true };

    const updated = await prisma.staffExpense.update({
      where: { id },
      data,
    });

    /* ================= SYNC SITE EXPENSE ================= */
    const newOut = parsedOut;
    const newSiteId = siteId || null;

    if (newOut && newSiteId) {
      if (mirror) {
        await prisma.siteExpense.update({
          where: { id: mirror.id },
          data: {
            siteId: newSiteId,
            expenseDate: finalDate,
            expenseTitle,
            summary: (summary || expenseTitle) as string,
            paymentDetails: ledgerName || mirror.paymentDetails || "",
            amount: newOut,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
          },
        });
      } else {
        await prisma.siteExpense.create({
          data: {
            site: { connect: { id: newSiteId } },
            expenseDate: finalDate,
            expenseTitle,
            summary: summary || expenseTitle,
            paymentDetails: ledgerName,
            amount: newOut,
            staffExpense: { connect: { id } },
          },
        });
      }
    } else {
      if (mirror) {
        await prisma.siteExpense.update({
          where: { id: mirror.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: null,
          },
        });
      }
    }

    // ✅ sync staff ledger balance (overall) after update
    const balance = await recomputeAndSyncStaffLedgerBalance(existing.staffLedgerId);

    return res.json({
      success: true,
      message: "Staff expense updated successfully",
      data: updated,
      ledgerBalance: balance,
    });
  } catch (error) {
    console.error("UPDATE STAFF EXPENSE ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update staff expense",
    });
  }
};
