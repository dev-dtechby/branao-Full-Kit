import express from "express";
import {
  createStaffExpense,
  getStaffLedgerEntries,
  updateStaffExpense,
} from "./staff-expense.controller";

const router = express.Router();

router.post("/", createStaffExpense);
router.get("/", getStaffLedgerEntries);
router.put("/:id", updateStaffExpense);

export default router;
