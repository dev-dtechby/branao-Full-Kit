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
      return res.status(400).json({ success: false, message: "ledgerId is required" });
    }

    const data = await getPaymentsByLedger(ledgerId);
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    return res
      .status(500)
      .json({ success: false, message: e?.message || "Failed to fetch" });
  }
};

export const createPaymentHandler = async (req: Request, res: Response) => {
  try {
    // ✅ support both paymentDate and entryDate + particular/particulars
    const {
      ledgerId,
      paymentDate,
      entryDate,
      paymentMode,
      particular,
      particulars,
      amount,
    } = req.body;

    const finalDate = entryDate ?? paymentDate;
    const finalParticular = particular ?? particulars;

    if (!ledgerId || !finalDate || !paymentMode || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing (ledgerId, entryDate/paymentDate, paymentMode, amount)",
      });
    }

    const created = await createPayment({
      ledgerId,
      entryDate: finalDate, // ✅ normalized
      paymentMode,
      particular: finalParticular,
      amount: Number(amount),
    });

    return res.status(201).json({ success: true, data: created });
  } catch (e: any) {
    return res
      .status(400)
      .json({ success: false, message: e?.message || "Create failed" });
  }
};

export const updatePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};

    // ✅ accept entryDate/paymentDate + particular/particulars
    const finalDate = patch.entryDate ?? patch.paymentDate;
    const finalParticular = patch.particular ?? patch.particulars;

    const updated = await updatePayment(id, {
      entryDate: finalDate,
      paymentMode: patch.paymentMode,
      particular: finalParticular,
      amount: patch.amount !== undefined ? Number(patch.amount) : undefined,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e: any) {
    return res
      .status(400)
      .json({ success: false, message: e?.message || "Update failed" });
  }
};

export const deletePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deletePayment(id);
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res
      .status(400)
      .json({ success: false, message: e?.message || "Delete failed" });
  }
};
