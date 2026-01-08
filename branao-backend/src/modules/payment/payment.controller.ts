import { Request, Response } from "express";
import {
  getPaymentsByLedger,
  createPayment,
  updatePayment,
  deletePayment,
} from "./payment.service";

export const getPaymentsHandler = async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.query as { ledgerId?: string };
    if (!ledgerId) {
      return res.status(400).json({ message: "ledgerId is required" });
    }

    const data = await getPaymentsByLedger(ledgerId);
    return res.json({ data });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to fetch" });
  }
};

export const createPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { ledgerId, paymentDate, paymentMode, particular, amount } = req.body;

    if (!ledgerId || !paymentDate || !paymentMode || amount === undefined) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const created = await createPayment({
      ledgerId,
      paymentDate,
      paymentMode,
      particular,
      amount: Number(amount),
    });

    return res.status(201).json({ data: created });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Create failed" });
  }
};

export const updatePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};

    const updated = await updatePayment(id, {
      paymentDate: patch.paymentDate,
      paymentMode: patch.paymentMode,
      particular: patch.particular,
      amount: patch.amount !== undefined ? Number(patch.amount) : undefined,
    });

    return res.json({ data: updated });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Update failed" });
  }
};

export const deletePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deletePayment(id);
    return res.json({ message: "Deleted" });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Delete failed" });
  }
};
