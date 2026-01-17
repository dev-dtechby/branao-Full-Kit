export type Site = { id: string; siteName: string };

export type LabourContractor = {
  id: string;
  name: string;
  mobile?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type LabourContract = {
  id: string;
  contractorId: string;
  siteId: string;
  agreedAmount: number;
  startDate?: string | null;
  endDate?: string | null;

  agreementUrl?: string | null;
  agreementName?: string | null;

  remarks?: string | null;

  site?: { id: string; siteName: string };
  contractor?: { id: string; name: string };
};

export type LabourPaymentMode = "CASH" | "BANK" | "UPI" | "CHEQUE" | "OTHER";

export type LabourPayment = {
  id: string;
  contractorId: string;
  siteId: string;
  contractId?: string | null;

  paymentDate: string;
  amount: number;

  mode: LabourPaymentMode;
  refNo?: string | null;
  through?: string | null;
  remarks?: string | null;

  site?: { id: string; siteName: string };
  contractor?: { id: string; name: string };
};

export type ContractorLedgerResponse = {
  summary: {
    contractorId: string;
    totalAgreed: number;
    totalPaid: number;
    totalBalance: number;
  };
  contracts: Array<{
    contractId: string;
    siteId: string;
    siteName: string;
    agreedAmount: number;
    paidAmount: number;
    balanceAmount: number;
    agreementUrl?: string | null;
    agreementName?: string | null;
    remarks?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  payments: LabourPayment[];
};
