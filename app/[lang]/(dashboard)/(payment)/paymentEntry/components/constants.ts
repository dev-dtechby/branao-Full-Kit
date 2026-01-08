import { PaymentMode } from "./types";

/* ================= API BASE ================= */
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export const LEDGER_TYPES_API = `${BASE_URL}/api/ledger-types`;
export const LEDGERS_API = `${BASE_URL}/api/ledgers`;
export const PAYMENTS_API = `${BASE_URL}/api/payments`;

export const PAYMENT_MODES: PaymentMode[] = [
  "CASH",
  "BANK",
  "UPI",
  "CHEQUE",
  "NEFT_RTGS",
  "OTHER",
];

export const MODE_LABEL: Record<PaymentMode, string> = {
  CASH: "Cash",
  BANK: "Bank",
  UPI: "UPI",
  CHEQUE: "Cheque",
  NEFT_RTGS: "NEFT/RTGS",
  OTHER: "Other",
};
