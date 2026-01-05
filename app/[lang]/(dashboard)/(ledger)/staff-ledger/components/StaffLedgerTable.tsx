"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

import StaffExpEntryForm from "./StaffExpEntryForm";
import StaffAmountReceive from "./StaffAmountReceive";
import EditStaffLedger from "./EditStaffLedger";
import { StaffExpense } from "./types";
import {
  exportStaffLedgerToExcel,
  exportStaffLedgerToPDF,
} from "./StaffLedgerExp";
import { importStaffLedgerExcel } from "./StaffLedgerImport";
import { useToast } from "@/components/ui/use-toast";

/* ================= TYPES ================= */
interface Ledger {
  id: string;
  name: string;
  address?: string | null;
  mobile?: string | null;
  ledgerType?: { name: string } | null;
}

interface Site {
  id: string;
  siteName: string;
  isDeleted?: boolean;
}

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= COMPONENT ================= */
export default function StaffLedgerTable() {
  const { toast } = useToast();

  // Ledger select (existing)
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState<"exp" | "received" | null>(null);

  const [staffLedgers, setStaffLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);

  const [entries, setEntries] = useState<StaffExpense[]>([]);
  const [loading, setLoading] = useState(false);

  const [editRow, setEditRow] = useState<StaffExpense | null>(null);

  // ✅ NEW: global search + site filter
  const [globalQuery, setGlobalQuery] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("ALL");

  // Export dropdown (existing)
  const [showExport, setShowExport] = useState(false);
  const exportWrapRef = useRef<HTMLDivElement | null>(null);

  // Import (existing)
  const [openImportGuide, setOpenImportGuide] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Row highlight (existing)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  /* ================= FETCH LEDGERS ================= */
  useEffect(() => {
    fetchStaffLedgers();
    fetchSites(); // ✅ NEW
  }, []);

  const fetchStaffLedgers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/ledgers?_ts=${Date.now()}`, {
        cache: "no-store",
        // credentials: "include", // (optional)
      });

      const json = await res.json();

      const list: Ledger[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      // original filter
      const filtered =
        list.filter((l) => {
          const t = l.ledgerType?.name?.toLowerCase() || "";
          return t.includes("staff") || t.includes("supervisor");
        }) ?? [];

      // ✅ fallback - if filter returns empty, show all ledgers
      setStaffLedgers(filtered.length ? filtered : list);
    } catch {
      setStaffLedgers([]);
    }
  };

  /* ================= FETCH SITES (NEW) ================= */
  const fetchSites = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/sites?_ts=${Date.now()}`, {
        cache: "no-store",
      });
      const json = await res.json();

      const list: Site[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      const active = list.filter((s) => !s?.isDeleted);
      // sort A-Z
      active.sort((a, b) =>
        (a.siteName || "").localeCompare(b.siteName || "")
      );

      setSites(active);
    } catch {
      setSites([]);
    }
  };

  /* ================= FETCH ENTRIES ================= */
  useEffect(() => {
    if (!selectedLedger?.id) {
      setEntries([]);
      return;
    }
    fetchEntries(selectedLedger.id);

    // ✅ NEW: when ledger changes, keep UI clean (optional but helpful)
    setGlobalQuery("");
    setSelectedSiteId("ALL");
    setActiveRowId(null);
    setHoveredRowId(null);
    setShowExport(false);
  }, [selectedLedger]);

  const fetchEntries = async (staffLedgerId: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/api/staff-expense?staffLedgerId=${staffLedgerId}&_ts=${Date.now()}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setEntries(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STAFF NAME LIST (DEDUP) ================= */
  const staffNameList = useMemo(() => {
    const set = new Set<string>();
    for (const l of staffLedgers) {
      if (l?.name) set.add(l.name);
    }
    return Array.from(set);
  }, [staffLedgers]);

  /* ================= FILTERED ENTRIES (NEW) ================= */
  const filteredEntries = useMemo(() => {
    let list = [...entries];

    // Site filter
    if (selectedSiteId && selectedSiteId !== "ALL") {
      list = list.filter((r: any) => {
        const rid = r?.siteId || r?.site?.id || "";
        return String(rid) === String(selectedSiteId);
      });
    }

    // Global search filter
    const q = globalQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r: any) => {
        const dateStr = r?.expenseDate
          ? new Date(r.expenseDate).toLocaleDateString().toLowerCase()
          : "";
        const siteName = (r?.site?.siteName || "").toLowerCase();
        const exp = (r?.expenseTitle || "").toLowerCase();
        const summary = (r?.summary || "").toLowerCase();
        const remark = (r?.remark || "").toLowerCase();
        const inAmt = r?.inAmount != null ? String(r.inAmount) : "";
        const outAmt = r?.outAmount != null ? String(r.outAmount) : "";

        return (
          dateStr.includes(q) ||
          siteName.includes(q) ||
          exp.includes(q) ||
          summary.includes(q) ||
          remark.includes(q) ||
          inAmt.includes(q) ||
          outAmt.includes(q)
        );
      });
    }

    return list;
  }, [entries, globalQuery, selectedSiteId]);

  /* ================= RUNNING BALANCE ================= */
  const rowsWithBalance = useMemo(() => {
    let balance = 0;

    return [...filteredEntries]
      .sort(
        (a, b) =>
          new Date(a.expenseDate).getTime() -
          new Date(b.expenseDate).getTime()
      )
      .map((row) => {
        balance += (row.inAmount || 0) - (row.outAmount || 0);
        return { ...row, balance };
      });
  }, [filteredEntries]);

  /* ================= EXPORT DATA ================= */
  const exportData = useMemo(() => {
    return rowsWithBalance.map((r) => ({
      Date: new Date(r.expenseDate).toLocaleDateString(),
      Site: r.site?.siteName || "",
      Expense: r.expenseTitle,
      Summary: r.summary || "",
      Remark: r.remark || "",
      In: r.inAmount || "",
      Out: r.outAmount || "",
      Balance: r.balance,
    }));
  }, [rowsWithBalance]);

  /* ================= EXPORT DROPDOWN: OUTSIDE CLICK ================= */
  useEffect(() => {
    if (!showExport) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (exportWrapRef.current && !exportWrapRef.current.contains(target)) {
        setShowExport(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowExport(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showExport]);

  /* ================= IMPORT HANDLER ================= */
  const runImport = async (file: File) => {
    if (!selectedLedger?.id) return;

    try {
      setImporting(true);

      toast({
        title: "⏳ Import started",
        description: "Please wait... entries are being imported",
      });

      const result = await importStaffLedgerExcel({
        file,
        staffLedgerId: selectedLedger.id,
        baseUrl: BASE_URL,
        onProgress: () => {},
      });

      await fetchEntries(selectedLedger.id);

      if (result.failCount === 0) {
        toast({
          title: "✅ Import completed",
          description: `${result.successCount} rows imported successfully`,
        });
      } else {
        toast({
          title: "⚠️ Import completed with errors",
          description: `Success: ${result.successCount}, Failed: ${result.failCount}`,
        });
        console.log("IMPORT ERRORS:", result.errors);
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
      <Card className="p-4 md:p-6 border rounded-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Staff Ledger</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Top Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* ✅ LEFT: Ledger select + Global search + Site dropdown */}
            <div className="w-full md:flex-1">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Ledger Select (existing) */}
                <div className="w-full md:w-[34%]">
                  <Input
                    placeholder="Search / Select Staff..."
                    value={search}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearch(val);

                      const needle = val.trim().toLowerCase();
                      const ledger =
                        staffLedgers.find(
                          (l) =>
                            (l.name || "").trim().toLowerCase() === needle
                        ) || null;

                      setSelectedLedger(ledger);
                    }}
                    list="staff-options"
                  />
                  <datalist id="staff-options">
                    {staffNameList.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>

                {/* ✅ NEW: Global Search */}
                <div className="w-full md:w-[33%]">
                  <Input
                    placeholder="Global Search (Expense/Summary/Remark/Site)..."
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    disabled={!selectedLedger}
                  />
                </div>

                {/* ✅ NEW: Site Dropdown */}
                <div className="w-full md:w-[33%]">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    disabled={!selectedLedger}
                  >
                    <option value="ALL">All Sites</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT: Buttons (existing) */}
            <div className="flex gap-2 md:ml-auto flex-wrap">
              <Button
                disabled={!selectedLedger}
                onClick={() => {
                  setShowExport(false);
                  setOpenForm("exp");
                }}
              >
                Expense Entry
              </Button>

              <Button
                variant="outline"
                disabled={!selectedLedger}
                onClick={() => {
                  setShowExport(false);
                  setOpenForm("received");
                }}
              >
                Amount Received
              </Button>

              <Button
                variant="outline"
                disabled={!selectedLedger || importing}
                onClick={() => {
                  setShowExport(false);
                  setOpenImportGuide(true);
                }}
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

              <div ref={exportWrapRef} className="relative">
                <Button
                  variant="outline"
                  disabled={!selectedLedger}
                  onClick={() => setShowExport(!showExport)}
                >
                  Export
                </Button>

                {showExport && selectedLedger && (
                  <div className="absolute right-0 top-12 w-44 bg-background border rounded-md shadow z-50">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => {
                        exportStaffLedgerToExcel(
                          exportData,
                          selectedLedger.name
                        );
                        setShowExport(false);
                      }}
                    >
                      Export Excel
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => {
                        exportStaffLedgerToPDF(exportData, selectedLedger.name);
                        setShowExport(false);
                      }}
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedLedger && (
            <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted">
              <div>
                <p className="text-xs">Account Of</p>
                <p className="font-semibold">{selectedLedger.name}</p>
              </div>
              <div>
                <p className="text-xs">Address</p>
                <p>{selectedLedger.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs">Contact</p>
                <p>{selectedLedger.mobile || "—"}</p>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="w-full text-sm" style={{ minWidth: 1200 }}>
              <thead className="bg-default-100">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Site</th>
                  <th className="p-3">Expense</th>
                  <th className="p-3">Summary</th>
                  <th className="p-3">Remark</th>
                  <th className="p-3 text-green-600">In</th>
                  <th className="p-3 text-red-500">Out</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && selectedLedger && rowsWithBalance.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground">
                      No entries found
                    </td>
                  </tr>
                )}

                {rowsWithBalance.map((row) => {
                  const isHover = hoveredRowId === row.id;
                  const isActive = activeRowId === row.id;

                  return (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      onClick={() => setActiveRowId(row.id)}
                      aria-selected={isActive}
                      className={[
                        "border-t cursor-pointer transition-colors duration-150",
                        "hover:bg-primary/5",
                        isHover ? "bg-primary/7" : "",
                        isActive ? "bg-primary/12" : "",
                      ].join(" ")}
                      style={{
                        boxShadow: isActive
                          ? "inset 4px 0 0 hsl(var(--primary))"
                          : isHover
                          ? "inset 4px 0 0 hsl(var(--primary) / 0.55)"
                          : undefined,
                      }}
                    >
                      <td className="p-3">
                        {new Date(row.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">{row.site?.siteName || "—"}</td>
                      <td className="p-3">{row.expenseTitle}</td>
                      <td className="p-3">{row.summary || "—"}</td>
                      <td className="p-3">{row.remark || "—"}</td>
                      <td className="p-3 text-green-600">
                        {row.inAmount ?? ""}
                      </td>
                      <td className="p-3 text-red-500">
                        {row.outAmount ?? ""}
                      </td>
                      <td className="p-3 font-semibold">{row.balance}</td>

                      <td
                        className="p-3 flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil
                          className="h-4 w-4 cursor-pointer text-blue-500"
                          onClick={() => {
                            setActiveRowId(row.id);
                            setEditRow(row);
                          }}
                        />
                        <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Import Guide (existing) */}
      <Dialog open={openImportGuide} onOpenChange={setOpenImportGuide}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Excel Import Guidelines</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm leading-6">
            <p className="font-medium">
              Excel file must have exactly these columns in first row (same
              order):
            </p>
            <div className="p-3 rounded-md border bg-muted/40 font-mono text-xs">
              Date | Site | Expense | Summary | Remark | In | Out
            </div>

            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Date</b> can be Excel Date or text (dd-mm-yyyy / dd/mm/yyyy).
              </li>
              <li>
                <b>Site</b> must match site name exactly as in Sites master (or
                keep blank).
              </li>
              <li>
                <b>Expense</b> is mandatory.
              </li>
              <li>
                <b>In</b> OR <b>Out</b> — only one should be filled (both filled
                not allowed).
              </li>
              <li>
                Every row will create a new entry (this import does not edit old
                rows).
              </li>
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
              disabled={importing || !selectedLedger}
            >
              OK, Select Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Entry (existing) */}
      <Dialog open={openForm === "exp"} onOpenChange={() => setOpenForm(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Expense Entry</DialogTitle>
          </DialogHeader>
          {selectedLedger && (
            <StaffExpEntryForm
              staffLedger={selectedLedger}
              onClose={() => {
                setOpenForm(null);
                fetchEntries(selectedLedger.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Amount Received (existing) */}
      <Dialog
        open={openForm === "received"}
        onOpenChange={() => setOpenForm(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Amount Received</DialogTitle>
          </DialogHeader>
          {selectedLedger && (
            <StaffAmountReceive
              staffLedger={selectedLedger}
              onClose={() => {
                setOpenForm(null);
                fetchEntries(selectedLedger.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Row (existing) */}
      <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
        <DialogContent className="max-w-xl">
          {editRow && (
            <EditStaffLedger
              row={editRow}
              onClose={() => setEditRow(null)}
              onUpdated={() => selectedLedger && fetchEntries(selectedLedger.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
