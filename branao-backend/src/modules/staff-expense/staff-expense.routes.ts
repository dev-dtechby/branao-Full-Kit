import express from "express";
import { createStaffExpense } from "./staff-expense.controller";

const router = express.Router();

router.post("/", createStaffExpense);

export default router;
