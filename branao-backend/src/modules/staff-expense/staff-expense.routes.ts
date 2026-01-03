import express from "express";
import {
  createStaffExpense,
  getStaffLedgerEntries,
  updateStaffExpense,
} from "./staff-expense.controller";

const router = express.Router();

/**
 * CREATE
 * Expense (Out) OR Amount Received (In)
 */
router.post("/", createStaffExpense);

/**
 * READ
 * Get all ledger entries by staffLedgerId
 * ?staffLedgerId=xxxx
 */
router.get("/", getStaffLedgerEntries);

/**
 * UPDATE
 * Edit single ledger entry
 * /api/staff-expense/:id
 */
router.put("/:id", updateStaffExpense);

export default router;
