import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/* ======================================================
   CREATE STAFF EXPENSE / RECEIPT (OUT + IN)
   ====================================================== */
export const createStaffExpense = async (
  req: Request,
  res: Response
) => {
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
    if (
      !staffLedgerId ||
      !expenseTitle ||
      (!outAmount && !inAmount)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "staffLedgerId, expenseTitle and amount (out/in) are required",
      });
    }

    if (outAmount && inAmount) {
      return res.status(400).json({
        success: false,
        message: "Only one of outAmount or inAmount is allowed",
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

    /* ================= BUILD DATA OBJECT ================= */
    const data: any = {
      staffLedger: {
        connect: { id: staffLedgerId },
      },
      expenseDate: expenseDate
        ? new Date(expenseDate)
        : new Date(),
      expenseTitle,
      summary: summary || null,
      remark: remark || null,
      outAmount: outAmount ? Number(outAmount) : null,
      inAmount: inAmount ? Number(inAmount) : null,
    };

    if (siteId) {
      data.site = {
        connect: { id: siteId },
      };
    }

    /* ================= STAFF EXPENSE ENTRY ================= */
    const staffExpense = await prisma.staffExpense.create({
      data,
    });

    /* ================= SITE EXPENSE (ONLY FOR OUT) ================= */
    if (outAmount && siteId) {
      await prisma.siteExpense.create({
        data: {
          site: {
            connect: { id: siteId },
          },
          expenseDate: expenseDate
            ? new Date(expenseDate)
            : new Date(),
          expenseTitle,
          summary: summary || expenseTitle,
          paymentDetails: staffLedger.name,
          amount: Number(outAmount),
        },
      });
    }

    return res.json({
      success: true,
      data: staffExpense,
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
   GET STAFF LEDGER ENTRIES (FOR TABLE VIEW)
   ====================================================== */
export const getStaffLedgerEntries = async (
  req: Request,
  res: Response
) => {
  try {
    const { staffLedgerId } = req.query;

    if (!staffLedgerId || typeof staffLedgerId !== "string") {
      return res.status(400).json({
        success: false,
        message: "staffLedgerId is required",
      });
    }

    const entries = await prisma.staffExpense.findMany({
      where: {
        staffLedgerId, // 🔥 CRITICAL FILTER
      },
      include: {
        site: {
          select: {
            siteName: true,
          },
        },
      },
      orderBy: {
        expenseDate: "asc",
      },
    });

    return res.json({
      success: true,
      data: entries,
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
   ====================================================== */
export const updateStaffExpense = async (
  req: Request,
  res: Response
) => {
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense id is required",
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
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Staff expense entry not found",
      });
    }

    const data: any = {
      expenseDate: expenseDate
        ? new Date(expenseDate)
        : existing.expenseDate,
      expenseTitle,
      summary: summary ?? null,
      remark: remark ?? null,
      outAmount: outAmount ? Number(outAmount) : null,
      inAmount: inAmount ? Number(inAmount) : null,
    };

    if (siteId) {
      data.site = {
        connect: { id: siteId },
      };
    } else {
      data.site = {
        disconnect: true,
      };
    }

    const updated = await prisma.staffExpense.update({
      where: { id },
      data,
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE STAFF EXPENSE ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update staff expense",
    });
  }
};
