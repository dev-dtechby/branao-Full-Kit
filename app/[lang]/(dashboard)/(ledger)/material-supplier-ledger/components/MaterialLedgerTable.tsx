"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  BadgePercent,
  FileText,
  Sheet,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MaterialForm from "../../../(purchase)/material-purchase-entry/components/MaterialForm";

import EditMaterialLedgerTable from "./EditMaterialLedgerTable";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const SUPPLIER_API = `${BASE_URL}/api/material-suppliers`;
const LEDGER_API = `${BASE_URL}/api/material-supplier-ledger`;

/* ================= TYPES ================= */
type Site = { id: string; siteName: string };

type Supplier = {
  id: string;
  name: string;
  contactNo?: string | null;
};

type LedgerRow = {
  id: string;
  entryDate: string; // ISO

  // ✅ IMPORTANT: backend generally returns siteId, not "site" include
  siteId?: string | null;
  site?: { id: string; siteName: string } | null;

  receiptNo?: string | null;
  parchiPhoto?: string | null;
  otp?: string | null;

  vehicleNo?: string | null;
  vehiclePhoto?: string | null;

  material: string;
  size?: string | null;

  qty: number;
  rate: number;

  royaltyQty?: number | null;
  royaltyRate?: number | null;
  royaltyAmt?: number | null;

  gstPercent?: number | null;
  taxAmt?: number | null;
  totalAmt?: number | null;

  paymentAmt?: number | null;
  balanceAmt?: number | null;
};

/* ================= HELPERS ================= */
function formatDate(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default function MaterialLedgerTable() {
  /* ================= MASTER DATA ================= */
  const [sites, setSites] = useState<Site[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  /* ================= FILTERS ================= */
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [contact, setContact] = useState("");

  /* ================= LEDGER ================= */
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= PURCHASE MODAL ================= */
  const [openPurchase, setOpenPurchase] = useState(false);

  /* ================= ACTIONS (EXPORT/IMPORT) ================= */
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* ================= ✅ CHECKBOX + BULK STATES ================= */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openBulkEdit, setOpenBulkEdit] = useState(false);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  /* ================= ✅ MATERIAL LIST COLLAPSE ================= */
  const [materialListOpen, setMaterialListOpen] = useState(true);

  /* ✅ quick lookup map for siteId -> siteName */
  const siteById = useMemo(() => {
    const m = new Map<string, Site>();
    sites.forEach((s) => m.set(s.id, s));
    return m;
  }, [sites]);

  /* ================= LOAD SITES + SUPPLIERS ================= */
  useEffect(() => {
    (async () => {
      try {
        const [sRes, supRes] = await Promise.all([
          fetch(`${SITE_API}?_ts=${Date.now()}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`${SUPPLIER_API}?_ts=${Date.now()}`, {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        if (sRes.ok) {
          const sData = await sRes.json();
          setSites(Array.isArray(sData) ? sData : sData?.data || []);
        }

        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(Array.isArray(supData) ? supData : supData?.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ================= OUTSIDE CLICK (EXPORT DROPDOWN) ================= */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!exportOpen) return;
      const target = e.target as Node;
      if (exportRef.current && !exportRef.current.contains(target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [exportOpen]);

  /* ================= SUPPLIER SUGGESTIONS ================= */
  const supplierSuggestions = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return suppliers.slice(0, 20);
    return suppliers.filter((x) => x.name.toLowerCase().includes(q)).slice(0, 20);
  }, [supplierQuery, suppliers]);

  function applySupplierByName(name: string) {
    const found = suppliers.find(
      (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (found) {
      setSelectedSupplierId(found.id);
      setSupplierQuery(found.name);
      setContact(found.contactNo || "");
      return true;
    }
    return false;
  }

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) || null,
    [suppliers, selectedSupplierId]
  );

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) || null,
    [sites, selectedSiteId]
  );

  /* ================= LOAD LEDGER ================= */
  async function loadLedger() {
    if (!selectedSupplierId) {
      setRows([]);
      return;
    }
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("supplierId", selectedSupplierId);
      if (selectedSiteId) params.set("siteId", selectedSiteId);

      const res = await fetch(`${LEDGER_API}?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setRows([]);
        return;
      }

      const data = await res.json();
      const arr: any[] = Array.isArray(data) ? data : data?.data || [];

      // ✅ normalize siteId so table + edit both get it
      const normalized: LedgerRow[] = arr.map((r: any) => {
        const sid: string | null =
          r?.siteId ?? r?.site?.id ?? (r?.site === null ? null : null);

        return {
          ...r,
          siteId: sid ?? null,
          // keep backend site if provided
          site: r?.site ?? null,
        };
      });

      setRows(normalized);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplierId, selectedSiteId]);

  /* ✅ keep selection clean when rows change */
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      const all = new Set(rows.map((r) => r.id));
      prev.forEach((id) => {
        if (all.has(id)) next.add(id);
      });
      return next;
    });
  }, [rows]);

  /* ================= ✅ BULK SELECTION HELPERS ================= */
  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  );

  /* ================= TOTALS ================= */
  const totals = useMemo(() => {
    const totalPay = rows.reduce((a, r) => a + n(r.paymentAmt), 0);
    const totalAmt = rows.reduce((a, r) => a + n(r.totalAmt), 0);
    const balance = totalAmt - totalPay;
    return { totalAmt, totalPay, balance };
  }, [rows]);

  /* ================= MATERIAL SUMMARY ================= */
  const materialSummary = useMemo(() => {
    const map = new Map<string, { qty: number; amt: number }>();
    for (const r of rows) {
      const key = (r.material || "Other").toString();
      const prev = map.get(key) || { qty: 0, amt: 0 };
      prev.qty += n(r.qty);
      prev.amt += n(r.totalAmt ?? n(r.qty) * n(r.rate));
      map.set(key, prev);
    }
    return map;
  }, [rows]);

  /* ================= ACTION HANDLERS (placeholder) ================= */
  const exportExcel = () => {
    setExportOpen(false);
    console.log("Export Excel", { rows, selectedSupplierId, selectedSiteId });
  };

  const exportPDF = () => {
    setExportOpen(false);
    console.log("Export PDF", { rows, selectedSupplierId, selectedSiteId });
  };

  const triggerImport = () => {
    importInputRef.current?.click();
  };

  const onImportFile = (file?: File) => {
    if (!file) return;
    console.log("Import file selected:", file.name);
  };

  const addRoyalty = () => {
    console.log("Add Royalty clicked");
  };

  /* ================= ✅ BULK DELETE ================= */
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setBulkDeleteLoading(true);

      for (const id of Array.from(selectedIds)) {
        const res = await fetch(`${LEDGER_API}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Bulk delete failed on some rows");
      }

      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      await loadLedger();
    } catch (e: any) {
      alert(e?.message || "Bulk delete failed");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const tableMaxHeightClass = materialListOpen ? "max-h-[65vh]" : "max-h-[75vh]";

  /* ================= UI ================= */
  return (
    <Card className="p-4 md:p-6 shadow-sm border rounded-xl">
      {/* ✅ HEADER: Title + compact filters on right */}
      <CardHeader className="pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <CardTitle className="text-xl md:text-2xl font-semibold text-default-900">
            Material Supplier Ledger
          </CardTitle>

          {/* Right side controls (compact) */}
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Supplier */}
              <div className="w-full lg:w-[260px]">
                <Input
                  placeholder="Supplier..."
                  value={supplierQuery}
                  onChange={(e) => {
                    setSupplierQuery(e.target.value);
                    if (!e.target.value) {
                      setSelectedSupplierId("");
                      setContact("");
                      setSelectedIds(new Set());
                    }
                  }}
                  onBlur={() => {
                    if (!selectedSupplierId) applySupplierByName(supplierQuery);
                  }}
                  list="supplier_datalist"
                  className="h-9"
                />
                <datalist id="supplier_datalist">
                  {supplierSuggestions.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {selectedSupplierId ? "Supplier selected" : "Type & select supplier"}
                </div>
              </div>

              {/* Site */}
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="border px-3 py-2 rounded-md bg-background text-sm h-9 w-full lg:w-[200px]"
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteName}
                  </option>
                ))}
              </select>

              {/* Contact */}
              <Input
                placeholder="Contact"
                value={contact}
                disabled
                className="h-9 w-full lg:w-[170px]"
              />

              {/* Purchase */}
              <Button
                className="flex items-center gap-2 h-9 w-full lg:w-[160px]"
                disabled={!selectedSupplierId}
                onClick={() => setOpenPurchase(true)}
              >
                <Plus className="h-4 w-4" /> Purchase
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ✅ MATERIAL LIST (Collapsible) */}
        <div className="border rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Material List</p>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 border bg-background/20 hover:bg-muted/40"
              onClick={() => setMaterialListOpen((p) => !p)}
              aria-label={materialListOpen ? "Collapse material list" : "Expand material list"}
              title={materialListOpen ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  materialListOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </Button>
          </div>

          {materialListOpen && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              {["Sand", "Limestone", "Murum", "Other"].map((m) => {
                const v = materialSummary.get(m) || { qty: 0, amt: 0 };
                return (
                  <div key={m} className="border rounded-md p-3 bg-background/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{m}</div>
                      <div className="text-[11px] text-muted-foreground">Summary</div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Input
                        value={v.qty ? String(v.qty) : ""}
                        placeholder="Qty"
                        className="h-9 text-sm"
                        disabled
                      />
                      <Input
                        value={v.amt ? String(Math.round(v.amt)) : ""}
                        placeholder="Amt"
                        className="h-9 text-sm"
                        disabled
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ✅ TOTALS + ACTIONS (same) */}
        <div className="flex flex-col md:flex-row md:items-stretch gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
            <div className="p-2 rounded-lg border bg-green-100/80 dark:bg-green-900/40">
              <p className="text-[10px] md:text-[11px] text-default-700">Total Amount</p>
              <p className="text-base md:text-lg font-bold text-green-700 dark:text-green-300 leading-tight">
                ₹ {totals.totalAmt.toFixed(2)}
              </p>
            </div>

            <div className="p-2 rounded-lg border bg-red-100/80 dark:bg-red-900/40">
              <p className="text-[10px] md:text-[11px] text-default-700">Total Pay</p>
              <p className="text-base md:text-lg font-bold text-red-700 dark:text-red-300 leading-tight">
                ₹ {totals.totalPay.toFixed(2)}
              </p>
            </div>

            <div className="p-2 rounded-lg border bg-blue-100/80 dark:bg-blue-900/40">
              <p className="text-[10px] md:text-[11px] text-default-700">Balance</p>
              <p className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-300 leading-tight">
                ₹ {totals.balance.toFixed(2)}
              </p>
            </div>

            <div className="p-2 rounded-lg border bg-background/30 flex flex-col gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => setOpenBulkEdit(true)}
                className="h-9"
              >
                Bulk Edit ({selectedIds.size})
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => setBulkDeleteOpen(true)}
                className="h-9"
              >
                Bulk Delete ({selectedIds.size})
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-2 md:justify-end md:items-center">
            <div ref={exportRef} className="relative">
              <Button
                variant="outline"
                className="h-10 flex items-center gap-2"
                disabled={!rows.length}
                onClick={() => setExportOpen((p) => !p)}
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-lg overflow-hidden z-50">
                  <button
                    type="button"
                    onClick={exportExcel}
                    className="w-full px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Sheet className="h-4 w-4" />
                    Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={exportPDF}
                    className="w-full px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => onImportFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="h-10 flex items-center gap-2"
              onClick={triggerImport}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>

            <Button className="h-10 flex items-center gap-2" onClick={addRoyalty}>
              <BadgePercent className="h-4 w-4" />
              Add Royalty
            </Button>
          </div>
        </div>

        {/* ---------------- LEDGER TABLE ---------------- */}
        <div className="rounded-md border overflow-hidden">
          <div className={`${tableMaxHeightClass} overflow-y-auto`}>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 1800 }}>
                <table className="w-full table-auto border-collapse text-sm">
                  <thead className="bg-default-100 text-default-700 sticky top-0 z-20">
                    <tr>
                      <th className="p-3 text-left whitespace-nowrap w-12">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label="Select all"
                          className="h-4 w-4 accent-primary border border-muted-foreground/40 rounded-sm"
                        />
                      </th>

                      {[
                        "DATE",
                        "Site",
                        "Receipt No",
                        "Parchi Photo",
                        "OTP",
                        "Vehicle No",
                        "Vehicle Photo",
                        "Material",
                        "Size",
                        "Qty",
                        "Rate",
                        "Royalty Qty",
                        "Royalty Rate",
                        "Royalty Amt",
                        "GST",
                        "Tax Amt",
                        "Total",
                        "Payment",
                        "Balance",
                        "Action",
                      ].map((head) => (
                        <th key={head} className="p-3 text-left whitespace-nowrap">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="p-4 text-muted-foreground" colSpan={21}>
                          Loading...
                        </td>
                      </tr>
                    ) : !rows.length ? (
                      <tr>
                        <td className="p-4 text-muted-foreground" colSpan={21}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const checked = selectedIds.has(row.id);

                        // ✅ Site name fallback: row.site missing => use row.siteId + sites map
                        const siteName =
                          row.site?.siteName ||
                          (row.siteId ? siteById.get(row.siteId)?.siteName : "") ||
                          "-";

                        return (
                          <tr
                            key={row.id}
                            className={`border-t hover:bg-default-50 ${
                              checked ? "bg-primary/10" : ""
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRow(row.id)}
                                aria-label={`Select row ${row.id}`}
                                className="h-4 w-4 accent-primary border border-muted-foreground/40 rounded-sm"
                              />
                            </td>

                            <td className="p-3">{formatDate(row.entryDate)}</td>

                            {/* ✅ FIXED Site Column */}
                            <td className="p-3">{siteName}</td>

                            <td className="p-3">{row.receiptNo || "-"}</td>
                            <td className="p-3">
                              {row.parchiPhoto ? (
                                <a
                                  className="underline text-primary"
                                  href={row.parchiPhoto}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-3">{row.otp || "-"}</td>
                            <td className="p-3">{row.vehicleNo || "-"}</td>
                            <td className="p-3">
                              {row.vehiclePhoto ? (
                                <a
                                  className="underline text-primary"
                                  href={row.vehiclePhoto}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="p-3">{row.material}</td>
                            <td className="p-3">{row.size || "-"}</td>
                            <td className="p-3">{row.qty}</td>
                            <td className="p-3">₹ {n(row.rate).toFixed(2)}</td>

                            <td className="p-3">{row.royaltyQty ?? "-"}</td>
                            <td className="p-3">
                              {row.royaltyRate != null
                                ? `₹ ${n(row.royaltyRate).toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="p-3">
                              {row.royaltyAmt != null
                                ? `₹ ${n(row.royaltyAmt).toFixed(2)}`
                                : "-"}
                            </td>

                            <td className="p-3">
                              {row.gstPercent != null ? `${n(row.gstPercent)}%` : "-"}
                            </td>
                            <td className="p-3">
                              {row.taxAmt != null ? `₹ ${n(row.taxAmt).toFixed(2)}` : "-"}
                            </td>
                            <td className="p-3 font-semibold">
                              {row.totalAmt != null ? `₹ ${n(row.totalAmt).toFixed(2)}` : "-"}
                            </td>
                            <td className="p-3">
                              {row.paymentAmt != null
                                ? `₹ ${n(row.paymentAmt).toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="p-3">
                              {row.balanceAmt != null
                                ? `₹ ${n(row.balanceAmt).toFixed(2)}`
                                : "-"}
                            </td>

                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button size="icon" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PURCHASE MODAL ================= */}
        <Dialog open={openPurchase} onOpenChange={setOpenPurchase}>
          <DialogContent
            className="
              !p-0 overflow-hidden
              !h-[92vh] !w-[96vw] !max-w-[96vw]
              !flex !flex-col
              [&>button]:hidden
            "
          >
            <div className="h-full min-h-0 flex flex-col">
              <div className="shrink-0 px-4 md:px-6 py-4 border-b bg-background/60 backdrop-blur flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base md:text-lg font-semibold">
                    Material Purchase Entry
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {selectedSupplier?.name ? `Supplier: ${selectedSupplier.name}` : ""}
                    {selectedSite?.siteName ? ` • Site: ${selectedSite.siteName}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpenPurchase(false)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div
                  className="h-full min-h-0 overflow-auto p-3 md:p-4"
                  style={{
                    scrollbarGutter: "stable",
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                  }}
                >
                  <MaterialForm />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= BULK EDIT MODAL ================= */}
        <Dialog open={openBulkEdit} onOpenChange={setOpenBulkEdit}>
          <DialogContent
            className="
              !w-[98vw]
              sm:!max-w-[1600px]
              !h-[92vh]
              !p-0
              !flex
              !flex-col
              overflow-hidden
            "
          >
            <EditMaterialLedgerTable
              rows={selectedRows}
              sites={sites}
              baseUrl={BASE_URL}
              onCancel={() => setOpenBulkEdit(false)}
              onSaved={async () => {
                setOpenBulkEdit(false);
                setSelectedIds(new Set());
                await loadLedger();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* ✅ BULK DELETE CONFIRM */}
        <DeleteConfirmDialog
          open={bulkDeleteOpen}
          title={`Delete ${selectedIds.size} Ledger Rows?`}
          description="Selected ledger entries will be deleted. This action cannot be undone."
          loading={bulkDeleteLoading}
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={confirmBulkDelete}
        />
      </CardContent>
    </Card>
  );
}
