import { Router } from "express";
import {
  getPaymentsHandler,
  createPaymentHandler,
  updatePaymentHandler,
  deletePaymentHandler,
} from "./payment.controller";

const router = Router();

/**
 * GET /api/payments?ledgerId=xxxx
 */
router.get("/", getPaymentsHandler);

/**
 * POST /api/payments
 */
router.post("/", createPaymentHandler);

/**
 * PUT /api/payments/:id
 */
router.put("/:id", updatePaymentHandler);

/**
 * DELETE /api/payments/:id
 */
router.delete("/:id", deletePaymentHandler);

export default router;
