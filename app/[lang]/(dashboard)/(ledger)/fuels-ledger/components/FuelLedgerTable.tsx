"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Pencil, Trash2, PencilLine, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

import FuelPurchaseForm from "@/app/[lang]/(dashboard)/(purchase)/fuels-purchase-entry/components/FuelPurchaseForm";
import FuelAmountReceive from "./fuelAmountReceive";
import EditFuelLedgerTable from "./EditFuelLedgerTable";

import type { FuelLedgerRow, FuelStation, Site } from "./fuel-ledger.types";

/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const LEDGERS_API = `${BASE_URL}/api/ledgers`;
const SITE_API = `${BASE_URL}/api/sites`;
const FUEL_LEDGER_API = `${BASE_URL}/api/fuel-station-ledger`;
const PAYMENTS_API = `${BASE_URL}/api/payments`;

/* ================= DISPLAY TYPES ================= */
type LedgerLite = {
  id: string;
  name: string;
  ledgerType?: { id?: string; name?: string | null } | null;
  mobile?: string | null;
  address?: string | null;
};

type PaymentDisplayRow = {
  id: string;
  entryDate: string;

  siteId?: string | null;
  siteName?: string | null;

  slipNo?: string | null;
  through?: string | null;

  // amounts
  amount?: number | null; // show in "Received" column if you want (keeping 0)
  payment: number;

  remarks?: string | null;

  __type: "PAYMENT";
};

type FuelDisplayRow = FuelLedgerRow & {
  siteName?: string | null; // convenience for UI
  ledgerName?: string | null; // convenience for UI
  payment?: number | null; // keep parity with table columns
  __type: "FUEL";
};

type DisplayRow = FuelDisplayRow | PaymentDisplayRow;

/* ================= HELPERS ================= */
function normalizeList(json: any) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [];
}

const num = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const fmtDate = (v: any) => {
  try {
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  } catch {
    return "";
  }
};

const includesText = (hay: string, needle: string) =>
  hay.toLowerCase().includes(needle.toLowerCase());

/* ====================== MAIN COMPONENT ====================== */
export default function FuelLedgerTable() {
  const [globalSearch, setGlobalSearch] = useState("");

  // dropdown filters
  const [selectedFuelStationId, setSelectedFuelStationId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");

  // dropdown lists
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  // rows
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(false);

  // dialogs
  const [openPurchaseForm, setOpenPurchaseForm] = useState(false);
  const [openAmountForm, setOpenAmountForm] = useState(false);
  const [openViewPopup, setOpenViewPopup] = useState<DisplayRow | null>(null);

  // bulk edit
  const [openBulkEdit, setOpenBulkEdit] = useState(false);

  // delete
  const [deleteItem, setDeleteItem] = useState<FuelDisplayRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // row selection
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const selectedFuelStation = useMemo(
    () => fuelStations.find((l) => l.id === selectedFuelStationId),
    [fuelStations, selectedFuelStationId]
  );

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId),
    [sites, selectedSiteId]
  );

  /* ================= LOAD DROPDOWNS ================= */
  const loadSites = async () => {
    try {
      const res = await fetch(`${SITE_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      const list: Site[] = normalizeList(json);

      // If your Site has isDeleted in API, filter it safely
      const active = list.filter((s: any) => !s?.isDeleted);
      active.sort((a, b) => (a.siteName || "").localeCompare(b.siteName || ""));
      setSites(active);
    } catch (e) {
      console.error("Sites load failed", e);
      setSites([]);
    }
  };

  const loadFuelStationsFromLedgers = async () => {
    try {
      const res = await fetch(`${LEDGERS_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      const list: LedgerLite[] = normalizeList(json);

      // filter fuel station ledgers (fallback to all if filter results empty)
      const filtered = list.filter((l) => {
        const t = String(l?.ledgerType?.name || "").toLowerCase();
        const nm = String(l?.name || "").toLowerCase();
        return (
          t.includes("fuel") ||
          t.includes("station") ||
          nm.includes("fuel") ||
          nm.includes("petrol") ||
          nm.includes("diesel") ||
          nm.includes("pump")
        );
      });

      const finalList = (filtered.length ? filtered : list)
        .map((x) => ({
          id: x.id,
          name: x.name,
          mobile: x.mobile ?? null,
          address: x.address ?? null,
        }))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setFuelStations(finalList);
    } catch (e) {
      console.error("Ledgers load failed", e);
      setFuelStations([]);
    }
  };

  useEffect(() => {
    if (!BASE_URL) {
      console.warn(
        "NEXT_PUBLIC_API_BASE_URL empty. Set to http://localhost:5000 and restart Next dev server."
      );
    }
    loadFuelStationsFromLedgers();
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= LOAD LEDGER ROWS ================= */
  const loadLedgerRows = async () => {
    if (!selectedFuelStationId) {
      setRows([]);
      setSelectedIds({});
      return;
    }

    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("fuelStationId", selectedFuelStationId);
      if (selectedSiteId) qs.set("siteId", selectedSiteId);

      // 1) Fuel purchase rows
      const fuelRes = await fetch(`${FUEL_LEDGER_API}?${qs.toString()}&_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const fuelJson = await fuelRes.json().catch(() => ({}));
      const fuelListRaw: any[] = normalizeList(fuelJson);

      const fuelRows: FuelDisplayRow[] = fuelListRaw.map((r: any) => ({
        // ---- MUST MATCH fuel-ledger.types ----
        id: r.id,
        entryDate: r.entryDate || r.createdAt || new Date().toISOString(),

        fuelStationId: r.fuelStationId ?? r.ledgerId ?? null,
        fuelStation: r.fuelStation
          ? { id: r.fuelStation.id, name: r.fuelStation.name }
          : r.ledger
          ? { id: r.ledger.id, name: r.ledger.name }
          : selectedFuelStation
          ? { id: selectedFuelStation.id, name: selectedFuelStation.name }
          : null,

        siteId: r.siteId ?? r.site?.id ?? null,
        site: r.site ? { id: r.site.id, siteName: r.site.siteName } : null,

        slipNo: r.slipNo ?? null,
        through: r.through ?? null,

        purchaseType: r.purchaseType ?? null,

        vehicleNumber: r.vehicleNumber ?? null,
        vehicleName: r.vehicleName ?? null,

        fuelType: r.fuelType ?? null,

        qty: r.qty != null ? num(r.qty) : null,
        rate: r.rate != null ? num(r.rate) : null,
        amount: r.amount != null ? num(r.amount) : num(r.qty) * num(r.rate),

        remarks: r.remarks ?? null,

        // ---- UI helpers ----
        siteName: r.site?.siteName ?? r.siteName ?? null,
        ledgerName:
          r.fuelStation?.name ?? r.ledger?.name ?? selectedFuelStation?.name ?? null,
        payment: 0,
        __type: "FUEL",
      }));

      // 2) Payment rows (optional)
      let paymentRows: PaymentDisplayRow[] = [];
      try {
        const pqs = new URLSearchParams();
        pqs.set("ledgerId", selectedFuelStationId);
        if (selectedSiteId) pqs.set("siteId", selectedSiteId);

        const payRes = await fetch(`${PAYMENTS_API}?${pqs.toString()}&_ts=${Date.now()}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (payRes.ok) {
          const payJson = await payRes.json().catch(() => ({}));
          const payListRaw: any[] = normalizeList(payJson);

          paymentRows = payListRaw.map((p: any) => ({
            id: p.id,
            entryDate:
              p.paymentDate ||
              p.entryDate ||
              p.date ||
              p.createdAt ||
              new Date().toISOString(),

            siteId: p.siteId ?? p.site?.id ?? null,
            siteName: p.site?.siteName ?? p.siteName ?? null,

            slipNo: p.slipNo ?? p.receiptNo ?? null,
            through: p.through ?? p.paymentMode ?? p.mode ?? null,

            amount: 0,
            payment: num(p.amount ?? p.paymentAmount ?? 0),

            remarks: p.remarks ?? p.remark ?? null,
            __type: "PAYMENT",
          }));
        }
      } catch {
        // ignore payments if endpoint differs
      }

      // Combine + sort by date
      const merged: DisplayRow[] = [...fuelRows, ...paymentRows].sort((a, b) => {
        const da = new Date(a.entryDate as any).getTime();
        const db = new Date(b.entryDate as any).getTime();
        return da - db;
      });

      setRows(merged);
      setSelectedIds({});
    } catch (e) {
      console.error("Ledger rows load failed", e);
      setRows([]);
      setSelectedIds({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFuelStationId, selectedSiteId]);

  /* ================= FILTERED / SEARCHED ================= */
  const filteredRows = useMemo(() => {
    if (!rows.length) return [];
    const q = globalSearch.trim();
    if (!q) return rows;

    return rows.filter((r) => {
      const fuelType = (r as any).fuelType || "";
      const qty = (r as any).qty ?? "";
      const received = num((r as any).amount);
      const payment = num((r as any).payment);

      const blob = [
        fmtDate(r.entryDate),
        (r as any).siteName || "",
        r.slipNo || "",
        r.through || "",
        (r as any).purchaseType || "",
        (r as any).vehicleNumber || "",
        (r as any).vehicleName || "",
        fuelType,
        String(qty),
        String(received),
        String(payment),
        r.remarks || "",
      ].join(" ");

      return includesText(blob, q);
    });
  }, [rows, globalSearch]);

  /* ================= TOTALS ================= */
  const totals = useMemo(() => {
    const totalReceived = filteredRows.reduce((sum, r) => sum + num((r as any).amount), 0);
    const totalPay = filteredRows.reduce((sum, r) => sum + num((r as any).payment), 0);
    const balance = totalReceived - totalPay;

    const totalDiesel = filteredRows
      .filter((r) => String((r as any).fuelType || "").toLowerCase() === "diesel")
      .reduce((sum, r) => sum + num((r as any).qty), 0);

    const totalPetrol = filteredRows
      .filter((r) => String((r as any).fuelType || "").toLowerCase() === "petrol")
      .reduce((sum, r) => sum + num((r as any).qty), 0);

    return { totalReceived, totalPay, balance, totalDiesel, totalPetrol };
  }, [filteredRows]);

  /* ================= SELECTION ================= */
  const visibleIds = useMemo(() => filteredRows.map((r) => r.id), [filteredRows]);

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  );

  const isAllVisibleSelected = useMemo(() => {
    if (!visibleIds.length) return false;
    return visibleIds.every((id) => selectedIds[id]);
  }, [visibleIds, selectedIds]);

  const toggleSelectOne = (row: DisplayRow) => {
    if ((row as any).__type === "PAYMENT") return;
    setSelectedIds((prev) => ({ ...prev, [row.id]: !prev[row.id] }));
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      const target = !isAllVisibleSelected;

      // only select FUEL rows
      filteredRows.forEach((r) => {
        if ((r as any).__type === "PAYMENT") return;
        next[r.id] = target;
      });

      return next;
    });
  };

  const selectedRows = useMemo(() => {
    const set = new Set(Object.keys(selectedIds).filter((k) => selectedIds[k]));
    return rows.filter((r) => set.has(r.id) && (r as any).__type === "FUEL") as FuelDisplayRow[];
  }, [rows, selectedIds]);

  /* ================= DELETE ================= */
  const deleteOne = async (row: FuelDisplayRow) => {
    if (!row?.id) return;

    setDeleting(true);
    try {
      const res = await fetch(`${FUEL_LEDGER_API}/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      await loadLedgerRows();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const bulkDelete = async () => {
    const toDelete = selectedRows;
    if (!toDelete.length) return;

    setDeleting(true);
    try {
      await Promise.all(
        toDelete.map((r) =>
          fetch(`${FUEL_LEDGER_API}/${r.id}`, { method: "DELETE", credentials: "include" })
        )
      );
      await loadLedgerRows();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Bulk delete failed");
    } finally {
      setDeleting(false);
      setSelectedIds({});
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-4 md:p-6 shadow-sm border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">Fuel Station Ledger</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* FILTER ROW */}
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              {/* Fuel Station Dropdown */}
              <div>
                <label className="text-xs text-muted-foreground">Fuel Station</label>
                <select
                  className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
                  value={selectedFuelStationId}
                  onChange={(e) => setSelectedFuelStationId(e.target.value)}
                >
                  <option value="">Select Fuel Station</option>
                  {fuelStations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Site Dropdown */}
              <div>
                <label className="text-xs text-muted-foreground">Site</label>
                <select
                  className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  disabled={!selectedFuelStationId}
                >
                  <option value="">All Sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Global Search */}
              <div>
                <label className="text-xs text-muted-foreground">Global Search</label>
                <Input
                  placeholder="Search (date / site / slip / through / vehicle / fuel / amount...)"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  disabled={!selectedFuelStationId}
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 xl:ml-auto flex-wrap">
              <Button onClick={() => setOpenPurchaseForm(true)} disabled={!selectedFuelStationId}>
                Fuel Purchase Entry
              </Button>

              <Button onClick={() => setOpenAmountForm(true)} disabled={!selectedFuelStationId}>
                Amount Received
              </Button>

              <Button
                variant="outline"
                onClick={loadLedgerRows}
                disabled={!selectedFuelStationId || loading}
                className="gap-2"
              >
                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setOpenBulkEdit(true)}
                disabled={!selectedFuelStationId || selectedRows.length === 0}
              >
                <PencilLine className="h-4 w-4" />
                Bulk Edit ({selectedRows.length})
              </Button>

              <Button
                variant="outline"
                onClick={bulkDelete}
                disabled={!selectedFuelStationId || selectedRows.length === 0 || deleting}
              >
                Delete Selected
              </Button>

              <Button variant="outline" disabled>
                Export
              </Button>
            </div>
          </div>

          {/* INFO BOX */}
          {selectedFuelStationId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted border">
              <div>
                <p className="text-xs text-muted-foreground">Fuel Station</p>
                <p className="font-semibold">{selectedFuelStation?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="truncate">{selectedFuelStation?.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p>{selectedFuelStation?.mobile || "—"}</p>
              </div>
            </div>
          )}

          {/* TOTAL CARDS */}
          {selectedFuelStationId && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-green-900 text-white p-4 rounded-xl">
                <p>Total Received</p>
                <h2 className="text-2xl font-bold">₹ {Math.round(totals.totalReceived)}</h2>
              </div>

              <div className="bg-red-900 text-white p-4 rounded-xl">
                <p>Total Pay</p>
                <h2 className="text-2xl font-bold">₹ {Math.round(totals.totalPay)}</h2>
              </div>

              <div className="bg-blue-900 text-white p-4 rounded-xl">
                <p>Balance</p>
                <h2 className="text-2xl font-bold">₹ {Math.round(totals.balance)}</h2>
              </div>

              <div className="bg-yellow-700 text-white p-4 rounded-xl">
                <p>Total Diesel Ltr</p>
                <h2 className="text-2xl font-bold">{Math.round(totals.totalDiesel)}</h2>
              </div>

              <div className="bg-purple-700 text-white p-4 rounded-xl">
                <p>Total Petrol Ltr</p>
                <h2 className="text-2xl font-bold">{Math.round(totals.totalPetrol)}</h2>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="rounded-md border w-full">
            <div style={{ overflowX: "auto" }}>
              <div className="max-h-[500px] overflow-auto">
                <div style={{ minWidth: 1500 }}>
                  <table className="w-full table-auto">
                    <thead className="bg-default-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            disabled={!selectedFuelStationId || filteredRows.length === 0}
                          />
                        </th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Site</th>
                        <th className="p-3">Receipt</th>
                        <th className="p-3">Through</th>
                        <th className="p-3">Purchase Type</th>
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Particular</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3 text-green-500">Received</th>
                        <th className="p-3 text-red-500">Payment</th>
                        <th className="p-3">Balance</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!selectedFuelStationId ? (
                        <tr>
                          <td colSpan={13} className="p-6 text-center text-muted-foreground">
                            Select Fuel Station to view ledger.
                          </td>
                        </tr>
                      ) : loading ? (
                        <tr>
                          <td colSpan={13} className="p-6 text-center text-muted-foreground">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="p-6 text-center text-muted-foreground">
                            No data found.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isPayment = (row as any).__type === "PAYMENT";

                          const received = num((row as any).amount);
                          const payment = num((row as any).payment);
                          const balance = received - payment;

                          const purchaseTypeLabel = isPayment
                            ? ""
                            : String((row as any).purchaseType || "")
                                .replace("OWN_VEHICLE", "Own")
                                .replace("RENT_VEHICLE", "Rental");

                          const vehicleLabel = isPayment
                            ? ""
                            : [
                                (row as any).vehicleName,
                                (row as any).vehicleNumber,
                              ]
                                .filter(Boolean)
                                .join(" ");

                          const particular = isPayment ? "" : ((row as any).fuelType || "");
                          const qty = isPayment ? "" : ((row as any).qty ?? "");

                          return (
                            <tr key={row.id} className="border-t hover:bg-default-50 transition">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!selectedIds[row.id]}
                                  onChange={() => toggleSelectOne(row)}
                                  disabled={isPayment}
                                  title={isPayment ? "Payment rows not editable here" : ""}
                                />
                              </td>

                              <td className="p-3">{fmtDate(row.entryDate)}</td>
                              <td className="p-3">
                                {(row as any).siteName || selectedSite?.siteName || ""}
                              </td>
                              <td className="p-3">{row.slipNo || ""}</td>
                              <td className="p-3">{row.through || ""}</td>
                              <td className="p-3">{purchaseTypeLabel}</td>
                              <td className="p-3">{vehicleLabel}</td>
                              <td className="p-3">{particular}</td>
                              <td className="p-3">{qty as any}</td>

                              <td className="p-3 text-green-600">
                                {received ? `₹ ${Math.round(received)}` : ""}
                              </td>

                              <td className="p-3 text-red-600">
                                {payment ? `₹ ${Math.round(payment)}` : ""}
                              </td>

                              <td className="p-3 font-semibold">
                                {balance < 0
                                  ? `-₹ ${Math.abs(Math.round(balance))}`
                                  : `₹ ${Math.round(balance)}`}
                              </td>

                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="icon" variant="outline" onClick={() => setOpenViewPopup(row)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      if (isPayment) return;
                                      setSelectedIds({ [row.id]: true });
                                      setOpenBulkEdit(true);
                                    }}
                                    disabled={isPayment}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      if (isPayment) return;
                                      setDeleteItem(row as FuelDisplayRow);
                                    }}
                                    disabled={isPayment}
                                    title={isPayment ? "Payment deletion not enabled here" : "Delete"}
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

            {selectedFuelStationId ? (
              <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                Visible: <b>{filteredRows.length}</b> • Selected: <b>{selectedCount}</b>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* POPUP 1 - Purchase Form (Responsive + Centered like Bulk Edit) */}
      <Dialog open={openPurchaseForm} onOpenChange={setOpenPurchaseForm}>
        <DialogContent
          className="
            !flex !flex-col !p-0 overflow-hidden
            !h-[92vh] !max-h-[92vh]

            /* ✅ never overflow viewport */
            !w-[calc(100vw-24px)] !max-w-[calc(100vw-24px)]
            sm:!w-[calc(100vw-40px)] sm:!max-w-[calc(100vw-40px)]
            md:!max-w-[1100px]
            lg:!max-w-[1400px]
            xl:!max-w-[1700px]
            2xl:!max-w-[1800px]

            /* ✅ hard center (prevents left/right cut) */
            !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
          "
        >
          {/* ✅ Outer DialogHeader हटाया (double title/space waste avoid)
              FuelPurchaseForm के अंदर already heading/UI होता है */}

          {/* ✅ Only this area scrolls */}
          <div className="flex-1 min-h-0 overflow-auto p-4">
            <FuelPurchaseForm onCancel={() => setOpenPurchaseForm(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP 2 - Amount Received */}
      <Dialog open={openAmountForm} onOpenChange={setOpenAmountForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Amount Received</DialogTitle>
          </DialogHeader>

          <FuelAmountReceive
            station={selectedFuelStation?.name || ""}
            onClose={() => setOpenAmountForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* POPUP 3 - View */}
      <Dialog open={!!openViewPopup} onOpenChange={() => setOpenViewPopup(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>View Details</DialogTitle>
          </DialogHeader>

          {openViewPopup && (
            <div className="space-y-2">
              {Object.entries(openViewPopup).map(([key, val]) => (
                <p key={key} className="text-sm">
                  <strong>{key}:</strong> {String(val ?? "-")}
                </p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

        {/* POPUP 4 - Bulk Edit (Centered + No Overflow) */}
        <Dialog open={openBulkEdit} onOpenChange={setOpenBulkEdit}>
          <DialogContent
            className="
              !flex !flex-col !p-0 overflow-hidden
              !h-[92vh] !max-h-[92vh]

              /* ✅ width never exceeds viewport, with safe padding */
              !w-[calc(100vw-24px)] !max-w-[calc(100vw-24px)]
              sm:!w-[calc(100vw-40px)] sm:!max-w-[calc(100vw-40px)]
              md:!max-w-[1100px]
              lg:!max-w-[1400px]
              xl:!max-w-[1700px]
              2xl:!max-w-[1800px]

              /* ✅ force perfect center (prevents left cut) */
              !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
            "
          >
            <EditFuelLedgerTable
              rows={selectedRows}
              sites={sites}
              fuelStations={fuelStations}
              baseUrl={BASE_URL}
              onCancel={() => setOpenBulkEdit(false)}
              onSaved={async () => {
                await loadLedgerRows();
                setOpenBulkEdit(false);
              }}
            />
          </DialogContent>
        </Dialog>




      {/* POPUP 5 - Delete Confirm (Hard Delete) */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        title="Delete Confirmation"
        description="Are you sure you want to delete this record? This will permanently delete from database."
        confirmText={deleting ? "Deleting..." : "Yes, Delete"}
        cancelText="Cancel"
        loading={deleting}
        onCancel={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!deleteItem) return;
          await deleteOne(deleteItem);
        }}
      />
    </>
  );
}
