import { Request, Response } from "express";
import * as service from "./site-exp.service";

/**
 * =========================================================
 * CREATE SITE EXPENSE
 * POST /api/site-exp
 * =========================================================
 */
export const createSiteExpense = async (req: Request, res: Response) => {
  try {
    const {
      siteId,
      expenseDate,
      expenseTitle,
      expenseSummary,
      paymentDetails,
      amount,
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!siteId || !expenseDate || !amount) {
      return res.status(400).json({
        success: false,
        message: "siteId, expenseDate and amount are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    const expense = await service.createSiteExpense(
      {
        siteId,
        expenseDate,
        expenseTitle,
        expenseSummary,
        paymentDetails,
        amount: Number(amount),
      },
      userId,
      ip
    );

    return res.status(201).json({
      success: true,
      message: "Site expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("❌ Create Site Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating expense",
    });
  }
};

/**
 * =========================================================
 * GET ALL SITE EXPENSES (ACTIVE ONLY)
 * GET /api/site-exp
 * =========================================================
 */
export const getAllSiteExpenses = async (_req: Request, res: Response) => {
  try {
    const expenses = await service.getAllSiteExpenses();

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("❌ Get All Site Expenses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site expenses",
    });
  }
};

/**
 * =========================================================
 * GET EXPENSES BY SITE (ACTIVE ONLY)
 * GET /api/site-exp/site/:siteId
 * =========================================================
 */
export const getExpensesBySite = async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: "Site ID is required",
      });
    }

    const expenses = await service.getExpensesBySite(siteId);

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("❌ Get Expenses By Site Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site expenses",
    });
  }
};

/**
 * =========================================================
 * UPDATE SITE EXPENSE (EDIT)
 * PUT /api/site-exp/:id
 * =========================================================
 */
export const updateSiteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      siteId,
      expenseDate,
      expenseTitle,
      expenseSummary,
      paymentDetails,
      amount,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required",
      });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    const updated = await service.updateSiteExpense(
      id,
      {
        siteId,
        expenseDate,
        expenseTitle,
        expenseSummary,
        paymentDetails,
        amount: Number(amount),
      },
      userId,
      ip
    );

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Update Site Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Expense update failed",
    });
  }
};

/**
 * =========================================================
 * DELETE SITE EXPENSE (SOFT DELETE)
 * DELETE /api/site-exp/:id
 * =========================================================
 */
export const deleteSiteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required",
      });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.softDeleteSiteExpense(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Site expense moved to deleted records",
    });
  } catch (error) {
    console.error("❌ Delete Site Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete site expense",
    });
  }
};
