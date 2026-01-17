"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, RefreshCw } from "lucide-react";

import {
  LabourContractor,
  Site,
  ContractorLedgerResponse,
  LabourContract,
  LabourPayment,
} from "./labour-ledger.types";

import AddContractorDialog from "./AddContractorDialog";
import AddContractDialog from "./AddContractDialog";
import AddPaymentDialog from "./AddPaymentDialog";

const clean = (v: any) => String(v ?? "").trim();

export default function ContractorLedgerTable({ baseUrl }: { baseUrl: string }) {
  const API = useMemo(() => `${baseUrl}/api/labour-contractor-ledger`, [baseUrl]);
  const SITE_API = useMemo(() => `${baseUrl}/api/sites`, [baseUrl]);

  const [loading, setLoading] = useState(false);

  const [contractors, setContractors] = useState<LabourContractor[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [search, setSearch] = useState("");
  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [siteFilterId, setSiteFilterId] = useState<string>("");

  const [ledger, setLedger] = useState<ContractorLedgerResponse | null>(null);

  const [openAddContractor, setOpenAddContractor] = useState(false);
  const [openAddContract, setOpenAddContract] = useState(false);
  const [openAddPayment, setOpenAddPayment] = useState(false);

  const selectedContractor = useMemo(
    () => contractors.find((c) => c.id === selectedContractorId) || null,
    [contractors, selectedContractorId]
  );

  const loadContractors = async () => {
    const res = await fetch(`${API}/contractors?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    setContractors(json?.data || []);
  };

  const loadSites = async () => {
    const res = await fetch(`${SITE_API}?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    setSites(json?.data || []);
  };

  const loadLedger = async () => {
    if (!selectedContractorId) {
      setLedger(null);
      return;
    }
    try {
      setLoading(true);
      const qs = siteFilterId ? `?siteId=${encodeURIComponent(siteFilterId)}` : "";
      const res = await fetch(`${API}/ledger/${selectedContractorId}${qs}&_ts=${Date.now()}`.replace("?&", "?"), {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      setLedger(json?.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractorId, siteFilterId]);

  const filteredContractors = useMemo(() => {
    const q = search.toLowerCase();
    return contractors.filter((c) => c.name.toLowerCase().includes(q) || (c.mobile || "").includes(q));
  }, [contractors, search]);

  const contractRows = ledger?.contracts || [];
  const paymentRows = ledger?.payments || [];

  return (
    <>
      <Card className="p-4 md:p-6 rounded-xl border shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Labour Contractor Ledger</div>
            <div className="text-xs text-muted-foreground">
              Site-wise deal amount + weekly payments + agreement upload
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => loadContractors()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={() => setOpenAddContractor(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contractor
            </Button>
            <Button
              variant="outline"
              disabled={!selectedContractorId}
              onClick={() => setOpenAddContract(true)}
            >
              Add Deal (Site Contract)
            </Button>
            <Button
              variant="outline"
              disabled={!selectedContractorId}
              onClick={() => setOpenAddPayment(true)}
            >
              Add Payment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Search Contractor</div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / Mobile" />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Select Contractor</div>
            <select
              className="border bg-background px-3 py-2 rounded-md text-sm w-full"
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
            >
              <option value="">Select...</option>
              {filteredContractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Site Filter</div>
            <select
              className="border bg-background px-3 py-2 rounded-md text-sm w-full"
              value={siteFilterId}
              onChange={(e) => setSiteFilterId(e.target.value)}
              disabled={!selectedContractorId}
            >
              <option value="">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Card className="p-4 rounded-xl border">
            <div className="text-xs text-muted-foreground">Total Deal (Agreed)</div>
            <div className="text-xl font-semibold">
              ₹ {ledger?.summary?.totalAgreed ?? 0}
            </div>
          </Card>

          <Card className="p-4 rounded-xl border">
            <div className="text-xs text-muted-foreground">Total Paid</div>
            <div className="text-xl font-semibold">
              ₹ {ledger?.summary?.totalPaid ?? 0}
            </div>
          </Card>

          <Card className="p-4 rounded-xl border">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-xl font-semibold">
              ₹ {ledger?.summary?.totalBalance ?? 0}
            </div>
          </Card>
        </div>

        {/* Tables */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Contracts table */}
          <Card className="rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/40">
              <div className="font-semibold text-sm">Site Contracts (Deals)</div>
              <div className="text-xs text-muted-foreground">
                Agreement link + site-wise amount
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: 820 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60 border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left">Site</th>
                      <th className="px-3 py-2 text-right">Agreed</th>
                      <th className="px-3 py-2 text-right">Paid</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                      <th className="px-3 py-2 text-left">Agreement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractRows.map((r) => (
                      <tr key={r.contractId} className="border-t hover:bg-primary/5">
                        <td className="px-3 py-2">{r.siteName}</td>
                        <td className="px-3 py-2 text-right">₹ {r.agreedAmount}</td>
                        <td className="px-3 py-2 text-right">₹ {r.paidAmount}</td>
                        <td className="px-3 py-2 text-right font-semibold">₹ {r.balanceAmount}</td>
                        <td className="px-3 py-2">
                          {r.agreementUrl ? (
                            <a
                              href={r.agreementUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              {r.agreementName || "View"}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {contractRows.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                          No contracts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Payments table */}
          <Card className="rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/40">
              <div className="font-semibold text-sm">Payments (Weekly)</div>
              <div className="text-xs text-muted-foreground">
                Payments are linked to Site
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: 920 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60 border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Site</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-left">Ref/Through</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRows.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-primary/5">
                        <td className="px-3 py-2">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">{p.site?.siteName || "-"}</td>
                        <td className="px-3 py-2">{p.mode}</td>
                        <td className="px-3 py-2">
                          {[clean(p.refNo), clean(p.through)].filter(Boolean).join(" / ") || "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ₹ {Number(p.amount || 0)}
                        </td>
                      </tr>
                    ))}
                    {paymentRows.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                          No payments
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Dialogs */}
      <AddContractorDialog
        open={openAddContractor}
        onClose={() => setOpenAddContractor(false)}
        apiBase={API}
        onSaved={async () => {
          await loadContractors();
        }}
      />

      <AddContractDialog
        open={openAddContract}
        onClose={() => setOpenAddContract(false)}
        apiBase={API}
        sites={sites}
        contractorId={selectedContractorId}
        contractorName={selectedContractor?.name || ""}
        onSaved={async () => {
          await loadLedger();
        }}
      />

      <AddPaymentDialog
        open={openAddPayment}
        onClose={() => setOpenAddPayment(false)}
        apiBase={API}
        sites={sites}
        contractorId={selectedContractorId}
        contractorName={selectedContractor?.name || ""}
        onSaved={async () => {
          await loadLedger();
        }}
      />
    </>
  );
}
