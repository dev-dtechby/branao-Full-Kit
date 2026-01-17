"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, X, RefreshCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

// ✅ Fuel Station will come from Ledgers (NO FuelStation model/table)
const LEDGERS_API = `${BASE_URL}/api/ledgers`;
const SITE_API = `${BASE_URL}/api/sites`;

// ✅ bulk save endpoint
const FUEL_BULK_API = `${BASE_URL}/api/fuel-station-ledger/bulk`;

/* ================= TYPES ================= */
type Site = { id: string; siteName: string; isDeleted?: boolean };

type FuelStationLedger = {
  id: string;
  name: string;
  mobile?: string | null;
  address?: string | null;
  ledgerType?: { name?: string | null } | null;
};

type PurchaseType = "OWN_VEHICLE" | "RENT_VEHICLE";

type FuelType = "Diesel" | "Petrol" | "CNG" | "LPG" | "AdBlue" | "Other";

type EntryRow = {
  id: string;

  entryDate: Date | undefined;

  // ✅ Slip/Receipt No (Through se pehle)
  slipNo: string;

  through: string;

  purchaseType: PurchaseType;

  // ✅ Vehicle number
  vehicleNumber: string;

  // ✅ Vehicle name
  vehicleName: string;

  fuelType: FuelType;

  qty: string;
  rate: string;

  remark: string;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

const isPositiveNumber = (v: string) => {
  const x = n(v);
  return Number.isFinite(x) && x > 0;
};

function toISO(d?: Date) {
  if (!d) return undefined;
  const t = d.getTime();
  return Number.isFinite(t) ? d.toISOString() : undefined;
}

function normalizeList(json: any) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [];
}

/* ================= COMPONENT ================= */
export default function FuelPurchaseForm({ onCancel }: { onCancel?: () => void }) {
  /* ================= TOP SELECTED ================= */
  const [ledgerId, setLedgerId] = useState("");
  const [siteId, setSiteId] = useState("");

  /* ================= DROPDOWN DATA ================= */
  const [fuelStations, setFuelStations] = useState<FuelStationLedger[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  /* ================= ROWS ================= */
  const [rows, setRows] = useState<EntryRow[]>([
    {
      id: uid(),
      entryDate: new Date(),
      slipNo: "",
      through: "",
      purchaseType: "OWN_VEHICLE",
      vehicleNumber: "",
      vehicleName: "",
      fuelType: "Diesel",
      qty: "",
      rate: "",
      remark: "",
    },
  ]);

  /* ================= LOADERS ================= */
  const loadSites = async () => {
    try {
      setLoadingSites(true);

      const res = await fetch(`${SITE_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      const list: Site[] = normalizeList(json);

      const active = list.filter((s) => !s?.isDeleted);
      active.sort((a, b) => (a.siteName || "").localeCompare(b.siteName || ""));
      setSites(active);
    } catch (e) {
      console.error("❌ Sites load failed:", e);
      setSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  // ✅ Fuel Stations from /api/ledgers
  const loadFuelStations = async () => {
    try {
      setLoadingStations(true);

      const res = await fetch(`${LEDGERS_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      const list: FuelStationLedger[] = normalizeList(json);

      // ✅ Filter (safe). If ledgerType missing OR filter empty -> fallback to all.
      const filtered = list.filter((l) => {
        const t = String(l?.ledgerType?.name || "").toLowerCase();
        const nm = String(l?.name || "").toLowerCase();
        return (
          t.includes("fuel") ||
          t.includes("station") ||
          nm.includes("fuel") ||
          nm.includes("petrol") ||
          nm.includes("diesel")
        );
      });

      const finalList = (filtered.length ? filtered : list)
        .map((x) => ({ id: x.id, name: x.name, ledgerType: x.ledgerType || null }))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setFuelStations(finalList as any);
    } catch (e) {
      console.error("❌ Fuel Stations load failed:", e);
      setFuelStations([]);
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    // ✅ Debug hint
    if (!BASE_URL) {
      console.warn(
        "⚠️ NEXT_PUBLIC_API_BASE_URL is empty. Set it to http://localhost:5000 and restart Next dev server."
      );
    }

    loadFuelStations();
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= ROW HELPERS ================= */
  const updateRow = (id: string, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        entryDate: new Date(),
        slipNo: "",
        through: "",
        purchaseType: "OWN_VEHICLE",
        vehicleNumber: "",
        vehicleName: "",
        fuelType: "Diesel",
        qty: "",
        rate: "",
        remark: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const resetAll = () => {
    setLedgerId("");
    setSiteId("");
    setRows([
      {
        id: uid(),
        entryDate: new Date(),
        slipNo: "",
        through: "",
        purchaseType: "OWN_VEHICLE",
        vehicleNumber: "",
        vehicleName: "",
        fuelType: "Diesel",
        qty: "",
        rate: "",
        remark: "",
      },
    ]);
  };

  /* ================= VALIDATION ================= */
  const rowValid = (r: EntryRow) => {
    return (
      !!r.entryDate &&
      r.slipNo.trim() &&
      r.through.trim() &&
      !!r.purchaseType &&
      r.vehicleNumber.trim() &&
      r.vehicleName.trim() &&
      !!r.fuelType &&
      isPositiveNumber(r.qty) &&
      isPositiveNumber(r.rate)
    );
  };

  const canSave = useMemo(() => {
    if (!ledgerId || !siteId) return false;
    if (!rows.length) return false;
    return rows.every(rowValid);
  }, [ledgerId, siteId, rows]);

  /* ================= TOTALS ================= */
  const totals = useMemo(() => {
    const totalQty = rows.reduce((a, r) => a + n(r.qty), 0);
    const totalAmt = rows.reduce((a, r) => a + n(r.qty) * n(r.rate), 0);
    const ready = rows.filter(rowValid).length;
    return { totalQty, totalAmt, ready, rowsCount: rows.length };
  }, [rows]);

  /* ================= SAVE BULK ================= */
  const saveAll = async () => {
    if (!ledgerId || !siteId) {
      alert("Please select Fuel Station and Site.");
      return;
    }
    if (!rows.length) {
      alert("No rows to save.");
      return;
    }
    if (!rows.every(rowValid)) {
      alert("Please complete all rows.");
      return;
    }

    try {
      const fd = new FormData();

      // global defaults
      fd.append("entryDate", new Date().toISOString());

      // ✅ Send ledgerId (primary)
      fd.append("ledgerId", ledgerId);

      // ✅ backward compatible (controller also accepts fuelStationId)
      fd.append("fuelStationId", ledgerId);

      fd.append("siteId", siteId);

      const payloadRows = rows.map((r) => ({
        rowKey: r.id,
        entryDate: toISO(r.entryDate),
        slipNo: r.slipNo.trim(),
        through: r.through.trim(),
        purchaseType: r.purchaseType,
        vehicleNumber: r.vehicleNumber.trim(),
        vehicleName: r.vehicleName.trim(),
        fuelType: r.fuelType,
        qty: n(r.qty),
        rate: n(r.rate),
        amount: n(r.qty) * n(r.rate),
        remarks: r.remark?.trim() || null, // ✅ backend expects "remarks"
      }));

      fd.append("rows", JSON.stringify(payloadRows));

      const res = await fetch(FUEL_BULK_API, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Save failed");

      alert(json?.message || "Saved successfully");
      resetAll();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Save failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="h-full w-full"
      style={{
        height: "100%",
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <Card className="border rounded-xl overflow-hidden">
        {/* HEADER */}
        <CardHeader className="pb-3 border-b bg-background/60 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl font-semibold text-default-900">
                Fuel Purchase Entry (Bulk)
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Top में Fuel Station / Site चुनो, नीचे table में multiple dates + entries add करो.
              </div>
              {siteId ? (
                <div className="text-[11px] text-muted-foreground mt-1">
                  • Site: {sites.find((s) => s.id === siteId)?.siteName || ""}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button type="button" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" /> Row
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* TOP CONTROLS */}
          <div className="p-4 md:p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fuel Station</Label>
                <select
                  className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                  value={ledgerId}
                  onChange={(e) => setLedgerId(e.target.value)}
                >
                  <option value="">
                    {loadingStations ? "Loading fuel stations..." : "Select Fuel Station"}
                  </option>
                  {fuelStations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <div className="mt-1 text-[11px] text-muted-foreground">
                  {ledgerId ? "Fuel Station selected" : "Select from dropdown (DB fetched)"}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Select Site</Label>
                <select
                  className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                >
                  <option value="">
                    {loadingSites ? "Loading sites..." : "Select Site"}
                  </option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg border bg-background/30">
                <p className="text-[10px] md:text-[11px] text-default-700">Rows</p>
                <p className="text-base md:text-lg font-bold leading-tight">{totals.rowsCount}</p>
              </div>
              <div className="p-2 rounded-lg border bg-background/30">
                <p className="text-[10px] md:text-[11px] text-default-700">Ready</p>
                <p className="text-base md:text-lg font-bold leading-tight">{totals.ready}</p>
              </div>
              <div className="p-2 rounded-lg border bg-background/30">
                <p className="text-[10px] md:text-[11px] text-default-700">Total Qty</p>
                <p className="text-base md:text-lg font-bold leading-tight">{totals.totalQty.toFixed(3)}</p>
              </div>
              <div className="p-2 rounded-lg border bg-background/30">
                <p className="text-[10px] md:text-[11px] text-default-700">Total Amount</p>
                <p className="text-base md:text-lg font-bold leading-tight">
                  ₹ {totals.totalAmt.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="p-3 md:p-4">
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "52vh",
                  scrollbarGutter: "stable",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 1700 }}>
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                        <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-2 py-2 w-10 text-center"> </th>
                          <th className="px-2 py-2 text-left">Date</th>
                          <th className="px-2 py-2 text-left">Slip/Receipt No</th>
                          <th className="px-2 py-2 text-left">Through</th>
                          <th className="px-2 py-2 text-left">PurchaseType</th>
                          <th className="px-2 py-2 text-left">Vehicle Number</th>
                          <th className="px-2 py-2 text-left">Vehicle</th>
                          <th className="px-2 py-2 text-left">Fuel Type</th>
                          <th className="px-2 py-2 text-left">Qty</th>
                          <th className="px-2 py-2 text-left">Rate</th>
                          <th className="px-2 py-2 text-left">Amount</th>
                          <th className="px-2 py-2 text-left">Remark</th>
                          <th className="px-2 py-2 text-left w-32">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rows.map((r, idx) => {
                          const ok = rowValid(r);
                          const amount = n(r.qty) * n(r.rate);

                          return (
                            <tr
                              key={r.id}
                              className={cn(
                                "border-t transition",
                                ok ? "bg-green-500/5" : "hover:bg-primary/5"
                              )}
                            >
                              <td className="px-2 py-2 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() => removeRow(r.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition"
                                  title="Remove row"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  {idx + 1}
                                </div>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className={cn(
                                        "h-8 w-40 flex items-center justify-between px-2 rounded-md border bg-background text-sm",
                                        !r.entryDate && "text-muted-foreground"
                                      )}
                                    >
                                      {r.entryDate ? r.entryDate.toLocaleDateString() : "Select Date"}
                                      <CalendarIcon className="h-4 w-4 opacity-60" />
                                    </button>
                                  </PopoverTrigger>

                                  <PopoverContent className="p-0 z-[9999]" align="start" side="bottom" sideOffset={8}>
                                    <Calendar
                                      mode="single"
                                      selected={r.entryDate}
                                      onSelect={(d) => updateRow(r.id, { entryDate: d })}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Slip / Receipt no"
                                  value={r.slipNo}
                                  onChange={(e) => updateRow(r.id, { slipNo: e.target.value })}
                                  className="h-8 w-44 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Through name"
                                  value={r.through}
                                  onChange={(e) => updateRow(r.id, { through: e.target.value })}
                                  className="h-8 w-52 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <select
                                  className="border px-2 py-1.5 rounded-md bg-background w-44 h-8 text-sm"
                                  value={r.purchaseType}
                                  onChange={(e) =>
                                    updateRow(r.id, { purchaseType: e.target.value as PurchaseType })
                                  }
                                >
                                  <option value="OWN_VEHICLE">Own Vehicle</option>
                                  <option value="RENT_VEHICLE">Rent Vehicle</option>
                                </select>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="CG 04 AB 1234"
                                  value={r.vehicleNumber}
                                  onChange={(e) => updateRow(r.id, { vehicleNumber: e.target.value })}
                                  className="h-8 w-48 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Vehicle name"
                                  value={r.vehicleName}
                                  onChange={(e) => updateRow(r.id, { vehicleName: e.target.value })}
                                  className="h-8 w-44 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <select
                                  className="border px-2 py-1.5 rounded-md bg-background w-36 h-8 text-sm"
                                  value={r.fuelType}
                                  onChange={(e) => updateRow(r.id, { fuelType: e.target.value as FuelType })}
                                >
                                  <option value="Diesel">Diesel</option>
                                  <option value="Petrol">Petrol</option>
                                  <option value="CNG">CNG</option>
                                  <option value="LPG">LPG</option>
                                  <option value="AdBlue">AdBlue</option>
                                  <option value="Other">Other</option>
                                </select>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Qty"
                                  value={r.qty}
                                  onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                                  className="h-8 w-24 text-sm"
                                  inputMode="decimal"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Rate"
                                  value={r.rate}
                                  onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                                  className="h-8 w-24 text-sm"
                                  inputMode="decimal"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  value={amount ? String(amount.toFixed(2)) : ""}
                                  placeholder="Amount"
                                  className="h-8 w-28 text-sm"
                                  readOnly
                                  tabIndex={-1}
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Remark"
                                  value={r.remark}
                                  onChange={(e) => updateRow(r.id, { remark: e.target.value })}
                                  className="h-8 w-52 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                {ok ? (
                                  <div className="text-green-500 text-xs font-medium">Ready</div>
                                ) : (
                                  <div className="text-[11px] text-muted-foreground">Fill required fields</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={13} className="p-6 text-center text-muted-foreground">
                              No rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground italic">
              Note: Each row has its own date. Multiple dates can be saved in one go.
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="border-t bg-background/60 backdrop-blur p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Rows: <b>{rows.length}</b> • Ready: <b>{rows.filter(rowValid).length}</b>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={resetAll} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </Button>

                <Button onClick={saveAll} disabled={!canSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>

                <Button variant="outline" onClick={() => onCancel?.()} className="gap-2">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
