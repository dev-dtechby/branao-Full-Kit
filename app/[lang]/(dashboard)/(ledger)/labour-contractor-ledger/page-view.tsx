"use client";

import ContractorLedgerTable from "./components/ContractorLedgerTable";

interface Props {
  trans: any;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function DashboardPageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-2xl font-medium text-default-800">
        Labour Contractor Ledger
      </div>

      <div className="card p-0 rounded-md border overflow-hidden">
        <ContractorLedgerTable baseUrl={BASE_URL} />
      </div>
    </div>
  );
}
