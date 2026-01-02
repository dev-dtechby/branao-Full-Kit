import { Request, Response } from "express";
import prisma from "../../lib/prisma";

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
    } = req.body;

    if (!staffLedgerId || !siteId || !expenseTitle || !outAmount) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    /* ================= FETCH STAFF LEDGER ================= */
    const staffLedger = await prisma.ledger.findUnique({
      where: { id: staffLedgerId },
      select: { name: true },
    });

    if (!staffLedger) {
      return res.status(404).json({
        message: "Staff ledger not found",
      });
    }

    /* ================= STAFF EXPENSE ================= */
    const staffExpense = await prisma.staffExpense.create({
      data: {
        staffLedger: {
          connect: { id: staffLedgerId },
        },
        site: {
          connect: { id: siteId },
        },
        expenseDate: new Date(expenseDate),
        expenseTitle,
        summary,
        remark,
        amount: outAmount,
      },
    });

    /* ================= SITE EXPENSE (LINKED) ================= */
    await prisma.siteExpense.create({
      data: {
        site: {
          connect: { id: siteId },
        },
        expenseDate: new Date(expenseDate),
        expenseTitle,
        summary: summary || expenseTitle,
        paymentDetails: staffLedger.name, // ✅ DYNAMIC LEDGER NAME
        amount: outAmount,
      },
    });

    res.json({
      success: true,
      data: staffExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Staff expense save failed",
    });
  }
};
