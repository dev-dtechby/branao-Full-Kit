// D:\Projects\branao.in\clone\branao-Full-Kit\app\[lang]\(dashboard)\(ledger)\material-supplier-ledger\components\MaterialLedgerTable.tsx

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
import {
  exportSupplierLedgerToExcel,
  exportSupplierLedgerToPDF,
} from "./ExportSupplilerLedger";


/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const SUPPLIER_API = `${BASE_URL}/api/material-suppliers`;
const LEDGER_API = `${BASE_URL}/api/material-supplier-ledger`;
const MATERIAL_MASTER_API = `${BASE_URL}/api/material-master`;

/* ================= TYPES ================= */
type Site = { id: string; siteName: string };

type Supplier = {
  id: string;
  name: string;
  contactNo?: string | null;
};

type MaterialMaster = {
  id: string;
  name: string;
};

type LedgerRow = {
  id: string;
  entryDate: string; // ISO
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

const cleanStr = (v: any) => String(v ?? "").trim();

/* ✅ Total = Qty * Rate | Balance = Total - Payment */
const rowTotal = (r: LedgerRow) => n(r.qty) * n(r.rate);
const rowPayment = (r: LedgerRow) => n(r.paymentAmt);
const rowBalance = (r: LedgerRow) => rowTotal(r) - rowPayment(r);

export default function MaterialLedgerTable() {
  /* ================= MASTER DATA ================= */
  const [sites, setSites] = useState<Site[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);

  /* ================= FILTERS ================= */
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  /* ================= LEDGER ================= */
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= PURCHASE MODAL ================= */
  const [openPurchase, setOpenPurchase] = useState(false);

  /* ================= PAYMENT ENTRY MODAL ================= */
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  /* ================= ACTIONS (EXPORT/IMPORT) ================= */
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* ================= ✅ CHECKBOX + BULK STATES ================= */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openBulkEdit, setOpenBulkEdit] = useState(false);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  /* ✅ Single delete */
  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string>("");
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false);

  /* ================= ✅ MATERIAL LIST COLLAPSE ================= */
  const [materialListOpen, setMaterialListOpen] = useState(true);

  /* ✅ Site map (Fix: show siteName even if backend doesn't include `site`) */
  const siteNameById = useMemo(() => {
    const m = new Map<string, string>();
    sites.forEach((s) => m.set(s.id, s.siteName));
    return m;
  }, [sites]);

  /* ================= LOAD SITES + SUPPLIERS + MATERIAL MASTER ================= */
  useEffect(() => {
    (async () => {
      try {
        const [sRes, supRes, mRes] = await Promise.all([
          fetch(`${SITE_API}?_ts=${Date.now()}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`${SUPPLIER_API}?_ts=${Date.now()}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`${MATERIAL_MASTER_API}?_ts=${Date.now()}`, {
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

        if (mRes.ok) {
          const mData = await mRes.json();
          const list = Array.isArray(mData) ? mData : mData?.data || [];
          setMaterials(list);
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
    return suppliers
      .filter((x) => x.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [supplierQuery, suppliers]);

  function applySupplierByName(name: string) {
    const found = suppliers.find(
      (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (found) {
      setSelectedSupplierId(found.id);
      setSupplierQuery(found.name);
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
      setRows(Array.isArray(data) ? data : data?.data || []);
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
    const totalPay = rows.reduce((a, r) => a + rowPayment(r), 0);
    const totalAmt = rows.reduce((a, r) => a + rowTotal(r), 0);
    const balance = totalAmt - totalPay;
    return { totalAmt, totalPay, balance };
  }, [rows]);

  /* ================= ✅ MATERIAL SUMMARY ================= */
  const materialCards = useMemo(() => {
    const masterNames = (materials || [])
      .map((m) => cleanStr(m.name))
      .filter(Boolean);

    const fallbackNames = Array.from(
      new Set(rows.map((r) => cleanStr(r.material)).filter(Boolean))
    );

    const names = masterNames.length ? masterNames : fallbackNames;

    const lowerToCanonical = new Map<string, string>();
    names.forEach((nm) => lowerToCanonical.set(nm.toLowerCase(), nm));

    const sums = new Map<string, { qty: number; amt: number }>();
    names.forEach((nm) => sums.set(nm, { qty: 0, amt: 0 }));

    let other = { qty: 0, amt: 0 };

    for (const r of rows) {
      const raw = cleanStr(r.material) || "Other";
      const key = raw.toLowerCase();
      const canonical = lowerToCanonical.get(key);

      const amt = rowTotal(r);
      if (canonical) {
        const prev = sums.get(canonical)!;
        prev.qty += n(r.qty);
        prev.amt += amt;
      } else {
        other.qty += n(r.qty);
        other.amt += amt;
      }
    }

    const cards = names.map((nm) => {
      const v = sums.get(nm) || { qty: 0, amt: 0 };
      return { name: nm, qty: v.qty, amt: v.amt };
    });

    const hasOther = other.qty !== 0 || other.amt !== 0;
    if (hasOther) cards.push({ name: "Other", qty: other.qty, amt: other.amt });

    return cards;
  }, [rows, materials]);

  /* ================= ACTION HANDLERS (placeholder) ================= */
  /* ================= EXPORT DATA ================= */
  const exportRows = (selectedIds.size ? selectedRows : rows).map((r) => {
    const total = rowTotal(r);
    const payment = rowPayment(r);
    const balance = rowBalance(r);

    const siteName =
      r.site?.siteName || (r.siteId ? siteNameById.get(r.siteId) : "") || "-";

    return {
      "DATE": formatDate(r.entryDate),
      "Site": siteName,
      "Receipt No": r.receiptNo || "",
      "Vehicle No": r.vehicleNo || "",
      "Material": r.material || "",
      "Size": r.size || "",
      "Qty": r.qty ?? "",
      "Rate": n(r.rate).toFixed(2),
      "Royalty Qty": r.royaltyQty ?? "",
      "Royalty Rate": r.royaltyRate != null ? n(r.royaltyRate).toFixed(2) : "",
      "Royalty Amt": r.royaltyAmt != null ? n(r.royaltyAmt).toFixed(2) : "",
      "GST": r.gstPercent != null ? `${n(r.gstPercent)}%` : "",
      "Tax Amt": r.taxAmt != null ? n(r.taxAmt).toFixed(2) : "",
      "Total": total.toFixed(2),
      "Payment": payment.toFixed(2),
      "Balance": balance.toFixed(2),
    };
  });


  const exportExcel = () => {
    setExportOpen(false);
    exportSupplierLedgerToExcel(exportRows, "Supplier_Ledger", {
      supplierName: selectedSupplier?.name || supplierQuery || "",
      siteName: selectedSite?.siteName || "All Sites",
    });
  };

  const exportPDF = () => {
    setExportOpen(false);
    exportSupplierLedgerToPDF(exportRows, "Supplier_Ledger", {
      supplierName: selectedSupplier?.name || supplierQuery || "",
      siteName: selectedSite?.siteName || "All Sites",
    });
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

  /* ================= ✅ SINGLE DELETE ================= */
  const openSingleDelete = (id: string) => {
    setSingleDeleteId(id);
    setSingleDeleteOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    try {
      setSingleDeleteLoading(true);
      const res = await fetch(`${LEDGER_API}/${singleDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");

      setSingleDeleteOpen(false);
      setSingleDeleteId("");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(singleDeleteId);
        return next;
      });
      await loadLedger();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setSingleDeleteLoading(false);
    }
  };

  /* ================= ✅ ROW EDIT (use existing Bulk Edit modal for single row) ================= */
  const editRow = (id: string) => {
    setSelectedIds(new Set([id]));
    setOpenBulkEdit(true);
  };

  /* ================= ✅ PAYMENT ENTRY (distribute payment across selected rows) ================= */
  const openPaymentEntry = () => {
    if (!selectedSupplierId) {
      alert("Please select supplier first.");
      return;
    }
    if (selectedIds.size === 0) {
      alert("Please select at least 1 row for payment entry.");
      return;
    }
    setPaymentAmount("");
    setOpenPayment(true);
  };

  const savePaymentEntry = async () => {
    const amt = n(paymentAmount);
    if (!amt || amt <= 0) {
      alert("Enter valid payment amount.");
      return;
    }
    if (selectedIds.size === 0) {
      alert("Select rows first.");
      return;
    }

    // sort selected rows by entryDate (oldest first)
    const sorted = [...selectedRows].sort((a, b) => {
      const da = new Date(a.entryDate).getTime();
      const db = new Date(b.entryDate).getTime();
      return da - db;
    });

    // compute updates
    let remaining = amt;
    const updates: Array<{ id: string; paymentAmt: number }> = [];

    for (const r of sorted) {
      if (remaining <= 0) break;

      const total = rowTotal(r);
      const paid = rowPayment(r);
      const due = Math.max(0, total - paid);
      if (due <= 0) continue;

      const alloc = Math.min(due, remaining);
      const newPaid = paid + alloc;

      updates.push({ id: r.id, paymentAmt: newPaid });
      remaining -= alloc;
    }

    if (!updates.length) {
      alert("Selected rows already fully paid.");
      return;
    }

    try {
      setPaymentSaving(true);

      // ✅ safest: update one-by-one using existing PUT /:id
      for (const u of updates) {
        const res = await fetch(`${LEDGER_API}/${u.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentAmt: u.paymentAmt }),
        });
        if (!res.ok) throw new Error("Payment update failed on some rows");
      }

      setOpenPayment(false);
      setPaymentAmount("");

      // keep selection as-is (optional). You can clear if you want:
      // setSelectedIds(new Set());

      await loadLedger();

      if (remaining > 0) {
        alert(
          `Payment saved. Extra amount not used: ₹ ${remaining.toFixed(2)} (rows fully paid)`
        );
      } else {
        alert("Payment saved successfully.");
      }
    } catch (e: any) {
      alert(e?.message || "Payment save failed");
    } finally {
      setPaymentSaving(false);
    }
  };

  const tableMaxHeightClass = materialListOpen ? "max-h-[65vh]" : "max-h-[75vh]";

  /* ================= UI ================= */
  return (
    <Card className="p-4 md:p-6 shadow-sm border rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <CardTitle className="text-xl md:text-2xl font-semibold text-default-900">
            Material Supplier Ledger
          </CardTitle>

          <div className="w-full lg:w-auto">
            {/* ✅ Contact box removed, Payment Entry button added */}
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

              {/* ✅ Payment Entry */}
              <Button
                variant="outline"
                className="h-9 w-full lg:w-[170px]"
                disabled={!selectedSupplierId || selectedIds.size === 0}
                onClick={openPaymentEntry}
                title={
                  !selectedSupplierId
                    ? "Select supplier first"
                    : selectedIds.size === 0
                    ? "Select rows for payment"
                    : "Payment Entry"
                }
              >
                Payment Entry ({selectedIds.size})
              </Button>

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
        {/* MATERIAL LIST */}
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
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {materialCards.map((m) => (
                <div key={m.name} className="border rounded-md p-3 bg-background/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">Summary</div>
                  </div>

                  {/* values visible */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input
                      value={m.qty ? String(m.qty) : ""}
                      placeholder="Qty"
                      className="h-9 text-sm"
                      readOnly
                      tabIndex={-1}
                    />
                    <Input
                      value={m.amt ? String(Math.round(m.amt)) : ""}
                      placeholder="Amt"
                      className="h-9 text-sm"
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOTALS + ACTIONS */}
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
            <Button variant="outline" className="h-10 flex items-center gap-2" onClick={triggerImport}>
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
                        const total = rowTotal(row);
                        const payment = rowPayment(row);
                        const balance = rowBalance(row);

                        const siteName =
                          row.site?.siteName ||
                          (row.siteId ? siteNameById.get(row.siteId) : "") ||
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

                            <td className="p-3 font-semibold">₹ {total.toFixed(2)}</td>
                            <td className="p-3">₹ {payment.toFixed(2)}</td>
                            <td className="p-3">₹ {balance.toFixed(2)}</td>

                            {/* ✅ Action: Edit + Delete working */}
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => editRow(row.id)}
                                  title="Edit row"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => openSingleDelete(row.id)}
                                  title="Delete row"
                                >
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

        {/* ================= PAYMENT ENTRY MODAL ================= */}
        <Dialog open={openPayment} onOpenChange={setOpenPayment}>
          <DialogContent
            className="
              !p-0 overflow-hidden
              !w-[96vw] !max-w-[560px]
              !flex !flex-col
              [&>button]:hidden
            "
          >
            <div className="h-full min-h-0 flex flex-col">
              <div className="shrink-0 px-4 md:px-6 py-4 border-b bg-background/60 backdrop-blur flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base md:text-lg font-semibold">Payment Entry</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {selectedSupplier?.name ? `Supplier: ${selectedSupplier.name}` : ""}
                    {selectedSite?.siteName ? ` • Site: ${selectedSite.siteName}` : ""}
                    {selectedIds.size ? ` • Selected Rows: ${selectedIds.size}` : ""}
                  </div>
                </div>

                <Button size="sm" variant="outline" onClick={() => setOpenPayment(false)} disabled={paymentSaving}>
                  Close
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Payment Amount</div>
                  <Input
                    placeholder="e.g. 5000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    inputMode="decimal"
                    className="h-10"
                  />
                  <div className="text-[11px] text-muted-foreground">
                    Payment selected rows (oldest first) me auto adjust ho jayega.
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-4 md:px-6 py-4 border-t bg-background/60 backdrop-blur flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenPayment(false)} disabled={paymentSaving}>
                  Cancel
                </Button>
                <Button onClick={savePaymentEntry} disabled={paymentSaving} className="min-w-[120px]">
                  {paymentSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              rows={selectedRows as any}
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

        {/* ✅ SINGLE DELETE CONFIRM */}
        <DeleteConfirmDialog
          open={singleDeleteOpen}
          title="Delete this ledger row?"
          description="This entry will be deleted. This action cannot be undone."
          loading={singleDeleteLoading}
          onCancel={() => {
            setSingleDeleteOpen(false);
            setSingleDeleteId("");
          }}
          onConfirm={confirmSingleDelete}
        />
      </CardContent>
    </Card>
  );
}
