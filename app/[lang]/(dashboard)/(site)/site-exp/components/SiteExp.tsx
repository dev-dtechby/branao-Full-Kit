"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Download, Edit, Trash2, Lock } from "lucide-react";
import SiteSummaryCards from "../../site-summary/components/SiteSummaryCards";
import AddExp from "./AddExp";
import EditExp from "./EditExp";

/* ========= SHADCN ========= */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ========= EXPORT ========= */
import {
  exportSiteExpenseToExcel,
  exportSiteExpenseToPDF,
} from "./siteExpExportUtils";

import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

/* ✅ IMPORT */
import { importSiteExpenseExcel } from "./SiteExpImoprtUtils";
import { useToast } from "@/components/ui/use-toast";

/* ✅ BULK EDIT COMPONENT */
import BulkEditSiteExp from "./BulkEditSiteExp";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

interface Expense {
  id: string;
  site: { id?: string; siteName: string };
  expenseDate: string;
  expenseTitle: string;
  summary: string;
  paymentDetails: string;
  amount: number;

  // ✅ AUTO rows
  isAuto?: boolean;
  autoSource?: string;
  supplierId?: string | null;
  source?: string;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const EXP_API = `${BASE_URL}/api/site-exp`;

/* =========================================================
   ✅ FUEL PURCHASE DISPLAY FIX (Frontend Only)
   - Fuel Purchase entries grouped by (site + fuelStation + fuelType)
   - Expenses column: "Diesel Exp" / "Petrol Exp" etc.
   - Exp. Summary: "Fuel Purchase"
   - Payment: Fuel Station name (e.g. Biswas Fuel)
   - Hide individual Fuel Purchase receipts (show only grouped totals)
========================================================= */

const toTime = (d: any) => {
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
};

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

const isFuelPurchaseRow = (r: any) => {
  const title = String(r?.expenseTitle || "").toLowerCase();
  const summary = String(r?.summary || "").toLowerCase();
  // Title usually: "Fuel Purchase - Diesel"
  // Summary usually includes: "Fuel Station: Biswas Fuel | Fuel: Diesel | ..."
  return title.includes("fuel purchase") || summary.includes("fuel station:");
};

const pickFuelType = (r: any) => {
  const title = String(r?.expenseTitle || "");
  const summary = String(r?.summary || "");

  // "Fuel Purchase - Diesel"
  let m = title.match(/fuel\s*purchase\s*-\s*([a-zA-Z]+)/i);
  if (m?.[1]) return m[1].trim();

  // "Fuel: Diesel |"
  m = summary.match(/fuel\s*:\s*([^|]+)/i);
  if (m?.[1]) return m[1].trim();

  return "Diesel";
};

const pickFuelStationName = (r: any) => {
  const summary = String(r?.summary || "");
  const m = summary.match(/fuel\s*station\s*:\s*([^|]+)/i);
  return (m?.[1] || "").trim() || "Fuel Station";
};

export default function SiteExp() {
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"exp" | "summary">("exp");
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [openAddExp, setOpenAddExp] = useState(false);

  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEditExp, setSelectedEditExp] = useState<any>(null);

  /* 🔥 DELETE STATES */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ✅ IMPORT STATES */
  const [openImportGuide, setOpenImportGuide] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ✅ BULK SELECTION STATES */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const [openBulkEdit, setOpenBulkEdit] = useState(false);

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    fetch(`${SITE_API}?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j) => setSites(j.data || []))
      .catch(() => setSites([]));
  }, []);

  /* ================= LOAD EXPENSES ================= */
  const loadExpenses = async () => {
    try {
      const res = await fetch(`${EXP_API}?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      setExpenses(json.data || []);
    } catch {
      setExpenses([]);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  /* ✅ refresh on focus/visibility */
  useEffect(() => {
    const refreshIfExpMode = () => {
      if (viewMode === "exp") loadExpenses();
    };

    const onFocus = () => refreshIfExpMode();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshIfExpMode();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [viewMode]);

  /* =========================================================
     ✅ DISPLAY EXPENSES (Fuel Purchase grouped + simplified)
  ========================================================= */
  const displayExpenses = useMemo<Expense[]>(() => {
    const list = Array.isArray(expenses) ? expenses : [];

    const other: Expense[] = [];
    const fuel: Expense[] = [];

    for (const r of list) {
      if (isFuelPurchaseRow(r)) fuel.push(r);
      else other.push(r);
    }

    // group by (siteId + fuelStation + fuelType)
    const map = new Map<
      string,
      {
        siteId: string;
        site: Expense["site"];
        fuelStation: string;
        fuelType: string;
        amount: number;
        maxDate: string;
      }
    >();

    for (const r of fuel) {
      const siteId = String((r as any)?.siteId || r?.site?.id || "");
      const siteObj = r?.site || { siteName: "N/A" };
      if (!siteId) {
        // fallback (rare) -> keep row as-is
        other.push(r);
        continue;
      }

      const fuelType = pickFuelType(r);
      const station = pickFuelStationName(r);
      const key = `${siteId}__${station.toLowerCase()}__${fuelType.toLowerCase()}`;

      const amt = Number((r as any)?.amount ?? 0) || 0;
      const dt = (r as any)?.expenseDate || new Date().toISOString();

      const ex = map.get(key);
      if (!ex) {
        map.set(key, {
          siteId,
          site: siteObj,
          fuelStation: station,
          fuelType,
          amount: amt,
          maxDate: dt,
        });
      } else {
        ex.amount += amt;
        if (toTime(dt) > toTime(ex.maxDate)) ex.maxDate = dt;
      }
    }

    const groupedFuelRows: Expense[] = Array.from(map.values()).map((g) => ({
      id: `AUTO_FUEL_${g.siteId}_${slugify(g.fuelStation)}_${slugify(g.fuelType)}`,
      site: g.site,
      expenseDate: g.maxDate,
      expenseTitle: `${g.fuelType} Exp`, // ✅ Expenses column
      summary: "Fuel Purchase", // ✅ Exp. Summary column
      paymentDetails: g.fuelStation, // ✅ Payment column (Fuel Station)
      amount: Number(g.amount.toFixed(2)),
      isAuto: true,
      autoSource: "FUEL_LEDGER",
      source: "FUEL_LEDGER",
    }));

    const merged = [...other, ...groupedFuelRows].sort(
      (a, b) => toTime(b?.expenseDate) - toTime(a?.expenseDate)
    );

    return merged;
  }, [expenses]);

  /* ================= FILTER + GLOBAL SEARCH ================= */
  const filtered = useMemo(() => {
    return displayExpenses.filter((v) => {
      const q = search.toLowerCase();

      const matchSearch =
        v.expenseTitle?.toLowerCase().includes(q) ||
        v.summary?.toLowerCase().includes(q) ||
        v.paymentDetails?.toLowerCase().includes(q) ||
        v.site?.siteName?.toLowerCase().includes(q) ||
        String(v.amount).includes(q) ||
        new Date(v.expenseDate)
          .toLocaleDateString()
          .toLowerCase()
          .includes(q);

      const matchSite = selectedSite ? v.site?.siteName === selectedSite : true;
      return matchSearch && matchSite;
    });
  }, [displayExpenses, search, selectedSite]);

  /* ✅ keep selection clean when expenses change */
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      // ✅ only manual ids are allowed in selection set
      const allManualIds = new Set(expenses.filter((e) => !e.isAuto).map((e) => e.id));
      prev.forEach((id) => {
        if (allManualIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [expenses]);

  /* ================= TOTAL ================= */
  const totalAmount = filtered.reduce((sum, v) => sum + Number(v.amount || 0), 0);

  /* ================= EXPORT ================= */
  const exportData = [
    ...filtered.map((row) => ({
      Site: row.site?.siteName || "N/A",
      Date: new Date(row.expenseDate).toLocaleDateString(),
      Expenses: row.expenseTitle,
      "Exp. Summary": row.summary,
      Payment: row.paymentDetails,
      Amount: row.amount,
      Type: row.isAuto ? "AUTO" : "MANUAL",
    })),
    ...(filtered.length
      ? [
          {
            Site: selectedSite || "All Sites",
            Date: "",
            Expenses: "",
            "Exp. Summary": "TOTAL",
            Payment: "",
            Amount: totalAmount,
            Type: "",
          },
        ]
      : []),
  ];

  /* ================= SINGLE SOFT DELETE ================= */
  const confirmDelete = async () => {
    if (!selectedExp) return;

    if (selectedExp.isAuto) {
      toast({
        title: "Readonly",
        description: "Auto expenses cannot be deleted from Site Expense screen.",
      });
      return;
    }

    try {
      setDeleteLoading(true);
      const res = await fetch(`${EXP_API}/${selectedExp.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      setDeleteOpen(false);
      setSelectedExp(null);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedExp.id);
        return next;
      });

      loadExpenses();
    } catch {
      alert("❌ Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ================= BULK SELECTION HELPERS ================= */
  const toggleRow = (id: string) => {
    // only manual rows should be selectable
    const row = expenses.find((x) => x.id === id);
    if (row?.isAuto) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ✅ only manual rows can be selected
  const visibleIds = useMemo(
    () => filtered.filter((r) => !r.isAuto).map((r) => r.id),
    [filtered]
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectedRows = useMemo(
    () => expenses.filter((e) => selectedIds.has(e.id) && !e.isAuto),
    [expenses, selectedIds]
  );

  /* ================= BULK DELETE ================= */
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setBulkDeleteLoading(true);

      for (const id of Array.from(selectedIds)) {
        const row = expenses.find((x) => x.id === id);
        if (row?.isAuto) continue; // just in case

        const res = await fetch(`${EXP_API}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Bulk delete failed on some rows");
        }
      }

      toast({
        title: "✅ Bulk delete completed",
        description: `${selectedIds.size} rows moved to deleted records`,
      });

      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      await loadExpenses();
    } catch (e: any) {
      toast({
        title: "❌ Bulk delete failed",
        description: e?.message || "Failed",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  /* ================= IMPORT HANDLER ================= */
  const runImport = async (file: File) => {
    try {
      setImporting(true);

      toast({
        title: "⏳ Import started",
        description: "Please wait... entries are being imported",
      });

      const result = await importSiteExpenseExcel({
        file,
        baseUrl: BASE_URL,
      });

      await loadExpenses();

      if (result.failCount === 0) {
        toast({
          title: "✅ Import completed",
          description: `${result.successCount} rows imported successfully`,
        });
      } else {
        toast({
          title: "⚠️ Import completed with errors",
          description: `Success: ${result.successCount}, Failed: ${result.failCount} (check console for error rows)`,
        });
        console.log("SITE-EXP IMPORT ERRORS:", result.errors);
      }
    } catch (e: any) {
      toast({
        title: "❌ Import failed",
        description: e?.message || "Import failed",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Card className="p-6 border rounded-xl shadow-sm">
        <CardHeader className="space-y-4">
          {/* MODE */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={viewMode === "exp"}
                onChange={() => setViewMode("exp")}
              />
              <span className="font-medium">Site Expense Details</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={viewMode === "summary"}
                onChange={() => setViewMode("summary")}
              />
              <span className="font-medium">Summary Wise Expense</span>
            </label>
          </div>

          {/* FILTER BAR */}
          {viewMode === "exp" && (
            <div className="flex flex-wrap gap-3 justify-end">
              <Input
                placeholder="Global Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-56"
              />

              <select
                className="border bg-background px-3 py-2 rounded-md text-sm md:w-44"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">Select Site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.siteName}>
                    {s.siteName}
                  </option>
                ))}
              </select>

              <Button onClick={() => setOpenAddExp(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Expense Entry
              </Button>

              <Button
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => setOpenBulkEdit(true)}
              >
                Bulk Edit ({selectedIds.size})
              </Button>

              <Button
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => setBulkDeleteOpen(true)}
              >
                Bulk Delete ({selectedIds.size})
              </Button>

              <Button
                variant="outline"
                disabled={importing}
                onClick={() => setOpenImportGuide(true)}
              >
                {importing ? "Importing..." : "Import Excel"}
              </Button>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  await runImport(file);
                }}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      exportSiteExpenseToExcel(exportData as any, "site-expenses")
                    }
                  >
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportSiteExpenseToPDF(exportData as any, "site-expenses")
                    }
                  >
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardHeader>

        {/* ================= TABLE ================= */}
        {viewMode === "exp" && (
          <CardContent className="p-0">
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: "1200px" }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60 sticky top-0 border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label="Select all visible"
                        />
                      </th>

                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Expenses</th>
                      <th className="px-3 py-2 text-left">Exp. Summary</th>
                      <th className="px-3 py-2 text-left">Payment</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((row) => {
                      const isAuto = !!row.isAuto;
                      const checked = !isAuto && selectedIds.has(row.id);

                      return (
                        <tr
                          key={row.id}
                          className={`border-t transition ${
                            isAuto
                              ? "bg-amber-50/30"
                              : checked
                              ? "bg-primary/15"
                              : "hover:bg-primary/10"
                          }`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isAuto}
                              onChange={() => toggleRow(row.id)}
                              aria-label={`Select row ${row.id}`}
                              className={isAuto ? "opacity-40" : ""}
                            />
                          </td>

                          <td className="px-3 py-2">
                            {new Date(row.expenseDate).toLocaleDateString()}
                          </td>

                          <td className="px-3 py-2 font-medium">
                            <div className="flex items-center gap-2">
                              <span>{row.expenseTitle}</span>
                              {isAuto && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-200/40 text-amber-700">
                                  <Lock className="h-3 w-3" /> AUTO
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-2">{row.summary}</td>

                          <td className="px-3 py-2">{row.paymentDetails}</td>

                          <td className="px-3 py-2 text-right font-semibold">
                            ₹ {Number(row.amount || 0)}
                          </td>

                          <td className="px-3 py-2">
                            {isAuto ? (
                              <div className="text-center text-muted-foreground">-</div>
                            ) : (
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedEditExp(row);
                                    setOpenEdit(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedExp(row);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filtered.length > 0 && (
                      <tr className="font-semibold bg-muted/40 border-t">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">Total</td>
                        <td colSpan={3}></td>
                        <td className="px-3 py-2 text-right">₹ {totalAmount}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        )}

        {viewMode === "summary" && <SiteSummaryCards />}
      </Card>

      {/* ✅ IMPORT GUIDELINE POPUP */}
      <Dialog open={openImportGuide} onOpenChange={setOpenImportGuide}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Excel Import Guidelines</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm leading-6">
            <p className="font-medium">
              Excel file must have exactly these columns in first row (same order):
            </p>

            <div className="p-3 rounded-md border bg-muted/40 font-mono text-xs">
              Site | Date | Expenses | Exp. Summary | Payment | Amount
            </div>

            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Site</b> must match site name exactly as in Sites master.
              </li>
              <li>
                <b>Date</b> can be Excel Date or text (dd-mm-yyyy / dd/mm/yyyy / yyyy-mm-dd).
              </li>
              <li>
                <b>Expenses</b> is mandatory.
              </li>
              <li>
                <b>Amount</b> must be greater than 0.
              </li>
              <li>Every row will create a new expense entry.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenImportGuide(false)}
              disabled={importing}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                setOpenImportGuide(false);
                setTimeout(() => fileRef.current?.click(), 0);
              }}
              disabled={importing}
            >
              OK, Select Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        title="Delete Expense?"
        description="This expense entry will be moved to Deleted Records. You can restore it later."
        loading={deleteLoading}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedExp(null);
        }}
        onConfirm={confirmDelete}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} Expenses?`}
        description="Selected expense entries will be moved to Deleted Records. You can restore them later."
        loading={bulkDeleteLoading}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
      />

      {/* ✅ BULK EDIT MODAL */}
      <Dialog open={openBulkEdit} onOpenChange={setOpenBulkEdit}>
        <DialogContent
          className="
            !w-[98vw]
            sm:!max-w-[1400px]
            !h-[92vh]
            !p-0
            !flex
            !flex-col
            overflow-hidden
          "
        >
          <BulkEditSiteExp
            rows={selectedRows as any}
            sites={sites}
            baseUrl={BASE_URL}
            onCancel={() => setOpenBulkEdit(false)}
            onSaved={async () => {
              setOpenBulkEdit(false);
              setSelectedIds(new Set());
              await loadExpenses();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Site Expense</DialogTitle>
          </DialogHeader>

          {selectedEditExp && (
            <EditExp
              expense={{
                id: selectedEditExp.id,
                siteId: selectedEditExp.site?.id || "",
                expenseDate: selectedEditExp.expenseDate,
                expenseTitle: selectedEditExp.expenseTitle,
                expenseSummary: selectedEditExp.summary,
                paymentDetails: selectedEditExp.paymentDetails,
                amount: selectedEditExp.amount,
              }}
              onClose={() => setOpenEdit(false)}
              onSaved={loadExpenses}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ADD EXP MODAL */}
      <Dialog open={openAddExp} onOpenChange={setOpenAddExp}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Site Expense</DialogTitle>
          </DialogHeader>
          <AddExp onClose={() => setOpenAddExp(false)} onSaved={loadExpenses} />
        </DialogContent>
      </Dialog>
    </>
  );
}
