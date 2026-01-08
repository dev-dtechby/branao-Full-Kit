// D:\Projects\branao.in\clone\branao-Full-Kit\branao-backend\src\modules\payment\payment.service.ts

import prisma from "../../lib/prisma";
import { Prisma } from "@prisma/client";

type CreatePaymentInput = {
  ledgerId: string;

  // UI backward compatibility
  paymentDate?: string | Date;
  entryDate?: string | Date;

  paymentMode: string;

  // UI sends `particular` (singular) — DB has `particulars`
  particular?: string;

  amount: number;
};

type UpdatePaymentInput = Partial<{
  paymentDate: string | Date;
  entryDate: string | Date;

  paymentMode: string;

  // UI sends `particular` (singular) — DB has `particulars`
  particular: string;

  amount: number;
}>;

function toISODate(d: string | Date) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) throw new Error("Invalid entryDate");
  return dt;
}

export const getPaymentsByLedger = async (ledgerId: string) => {
  if (!ledgerId) throw new Error("ledgerId is required");

  const rows = await prisma.paymentEntry.findMany({
    where: { ledgerId },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
  });

  // Decimal -> number for UI + alias particulars -> particular (optional)
  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
    // optional alias if UI expects "particular"
    particular: (r as any).particulars ?? null,
  }));
};

export const createPayment = async (data: CreatePaymentInput) => {
  const amount = Number(data.amount || 0);
  if (!data.ledgerId) throw new Error("ledgerId is required");
  if (!amount || amount <= 0) throw new Error("amount must be > 0");

  const entryDateRaw = data.entryDate ?? data.paymentDate ?? new Date();

  const created = await prisma.paymentEntry.create({
    data: {
      ledgerId: data.ledgerId,
      entryDate: toISODate(entryDateRaw),
      paymentMode: data.paymentMode as any,

      // ✅ FIX: DB field name is `particulars`
      particulars: data.particular?.trim() || null,

      amount: new Prisma.Decimal(amount),
    },
  });

  return {
    ...created,
    amount: Number(created.amount),
    particular: (created as any).particulars ?? null,
  };
};

export const updatePayment = async (id: string, patch: UpdatePaymentInput) => {
  if (!id) throw new Error("id is required");

  const data: Prisma.PaymentEntryUpdateInput = {};

  const entryDatePatch = patch.entryDate ?? patch.paymentDate;
  if (entryDatePatch) data.entryDate = toISODate(entryDatePatch);

  if (patch.paymentMode) data.paymentMode = patch.paymentMode as any;

  // ✅ FIX: DB field name is `particulars`
  if (patch.particular !== undefined) {
    (data as any).particulars = patch.particular?.trim() || null;
  }

  if (patch.amount !== undefined) {
    const amt = Number(patch.amount || 0);
    if (!amt || amt <= 0) throw new Error("amount must be > 0");
    data.amount = new Prisma.Decimal(amt);
  }

  const updated = await prisma.paymentEntry.update({
    where: { id },
    data,
  });

  return {
    ...updated,
    amount: Number(updated.amount),
    particular: (updated as any).particulars ?? null,
  };
};

export const deletePayment = async (id: string) => {
  if (!id) throw new Error("id is required");
  await prisma.paymentEntry.delete({ where: { id } });
  return true;
};
