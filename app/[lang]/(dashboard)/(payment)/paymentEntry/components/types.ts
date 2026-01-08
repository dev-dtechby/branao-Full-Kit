export type Site = { id: string; siteName: string };
export type LedgerType = { id: string; name: string };

export type Ledger = {
  id: string;
  ledgerTypeId: string;
  ledgerType?: LedgerType | null;

  siteId?: string | null;
  site?: Site | null;

  name: string;
  address?: string | null;
  mobile?: string | null;

  openingBalance?: string | number | null;
  closingBalance?: string | number | null;
  remark?: string | null;
};

export type PaymentMode = "CASH" | "BANK" | "UPI" | "CHEQUE" | "NEFT_RTGS" | "OTHER";

export type PaymentRow = {
  id: string;
  paymentDate: string; // ISO
  paymentMode: PaymentMode;
  particular?: string | null;
  amount: number;

  ledgerId: string;

  createdAt?: string | null;
  updatedAt?: string | null;
};
