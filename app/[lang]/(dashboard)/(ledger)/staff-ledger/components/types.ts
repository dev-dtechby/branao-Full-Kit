export interface SiteLite {
  id?: string;
  siteName?: string;
}

export interface StaffExpense {
  id: string;
  expenseDate: string;
  site?: SiteLite | null;
  expenseTitle: string;
  summary?: string | null;
  remark?: string | null;
  outAmount?: number | null;
  inAmount?: number | null;
}
