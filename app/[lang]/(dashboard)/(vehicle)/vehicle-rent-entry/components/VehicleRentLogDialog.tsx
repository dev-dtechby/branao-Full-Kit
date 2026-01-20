"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { API } from "./vehicle-rent.api";
import type { Site, VehicleRentLog, VehicleRentVehicle } from "./vehicle-rent.types";

/* ================= HELPERS ================= */
const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const pad2 = (x: number) => String(x).padStart(2, "0");
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toISOFromYMD = (ymd: string) => {
  // ymd: YYYY-MM-DD -> Date at local midnight, then ISO
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  const t = dt.getTime();
  return Number.isFinite(t) ? dt.toISOString() : undefined;
};

const safeLower = (v: any) => String(v ?? "").toLowerCase();

function inferOwnerId(v: any) {
  return String(
    v?.ownerLedgerId ??
      v?.ledgerId ??
      v?.ownerId ??
      v?.ownerLedger?.id ??
      v?.ledger?.id ??
      ""
  ).trim();
}

function inferOwnerName(v: any) {
  const nm =
    v?.ownerLedgerName ??
    v?.ledgerName ??
    v?.ownerName ??
    v?.ownerLedger?.name ??
    v?.ledger?.name ??
    "";
  return String(nm ?? "").trim();
}

function inferBillingType(vehicle: any): "MONTHLY" | "HOURLY" | "UNKNOWN" {
  const t = safeLower(vehicle?.billingType ?? vehicle?.rentType ?? vehicle?.type ?? vehicle?.chargeType);
  if (vehicle?.isMonthly === true) return "MONTHLY";
  if (vehicle?.isHourly === true) return "HOURLY";
  if (t.includes("month")) return "MONTHLY";
  if (t.includes("hour")) return "HOURLY";
  return "UNKNOWN";
}

function inferMonthlyAmt(vehicle: any) {
  return n(
    vehicle?.monthlyAmt ??
      vehicle?.monthlyRent ??
      vehicle?.monthlyRate ??
      vehicle?.rentPerMonth ??
      vehicle?.perMonth ??
      vehicle?.amountMonthly ??
      0
  );
}

function inferHourlyRate(vehicle: any) {
  return n(
    vehicle?.hourlyRate ??
      vehicle?.hourlyRs ??
      vehicle?.ratePerHour ??
      vehicle?.perHour ??
      vehicle?.hourRate ??
      vehicle?.rate ??
      0
  );
}

/* ================= TYPES ================= */
type EntryRow = {
  id: string;
  entryDate: string; // YYYY-MM-DD
  startMeter: string;
  endMeter: string;
  dieselLtr: string;
  dieselAmt: string;
  paymentAmt: string;
  remarks: string;
};

export default function VehicleRentLogDialog({
  open,
  onClose,
  mode,
  sites,
  vehicles,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  mode: "CREATE" | "EDIT";
  sites: Site[];
  vehicles: VehicleRentVehicle[];
  initial?: Partial<VehicleRentLog>;
  onSaved?: () => void;
}) {
  /* ================= TOP DROPDOWNS ================= */
  const ownerOptions = useMemo(() => {
    const mp = new Map<string, string>();
    (vehicles || []).forEach((v: any) => {
      const id = inferOwnerId(v);
      const name = inferOwnerName(v);
      if (id && !mp.has(id)) mp.set(id, name || id);
    });
    const arr = Array.from(mp.entries()).map(([id, name]) => ({ id, name }));
    arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return arr;
  }, [vehicles]);

  const [ownerLedgerId, setOwnerLedgerId] = useState<string>("");

  const filteredVehicles = useMemo(() => {
    const list = vehicles || [];
    if (!ownerLedgerId) return list;
    return list.filter((v: any) => inferOwnerId(v) === ownerLedgerId);
  }, [vehicles, ownerLedgerId]);

  const [vehicleId, setVehicleId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");

  const selectedVehicle = useMemo(
    () => (filteredVehicles || []).find((v: any) => String(v.id) === String(vehicleId)) || null,
    [filteredVehicles, vehicleId]
  );

  /* ================= ROWS ================= */
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        entryDate: toYMD(new Date()),
        startMeter: "",
        endMeter: "",
        dieselLtr: "",
        dieselAmt: "",
        paymentAmt: "",
        remarks: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const patchRow = (id: string, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  /* ================= INIT ON OPEN ================= */
  useEffect(() => {
    if (!open) return;

    // Owner/Vehicle/Site init
    const initVehicleId = String(initial?.vehicleId ?? "");
    const initSiteId = String(initial?.siteId ?? "");

    // try infer owner from vehicle
    const vObj: any = (vehicles || []).find((v: any) => String(v.id) === initVehicleId) || null;
    const initOwnerId = vObj ? inferOwnerId(vObj) : "";

    setOwnerLedgerId(initOwnerId || "");
    setVehicleId(initVehicleId || "");
    setSiteId(initSiteId || "");

    // Rows init
    if (mode === "EDIT") {
      const d = initial?.entryDate ? new Date(initial.entryDate as any) : new Date();
      setRows([
        {
          id: uid(),
          entryDate: toYMD(d),
          startMeter: String(initial?.startMeter ?? ""),
          endMeter: String(initial?.endMeter ?? ""),
          dieselLtr: String((initial as any)?.dieselLtr ?? ""),
          dieselAmt: String((initial as any)?.dieselAmt ?? (initial as any)?.dieselExp ?? ""),
          paymentAmt: String(initial?.paymentAmt ?? ""),
          remarks: String(initial?.remarks ?? ""),
        },
      ]);
    } else {
      setRows([
        {
          id: uid(),
          entryDate: toYMD(new Date()),
          startMeter: "",
          endMeter: "",
          dieselLtr: "",
          dieselAmt: "",
          paymentAmt: "",
          remarks: "",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ================= COMPUTATIONS ================= */
  const billingType = useMemo(() => inferBillingType(selectedVehicle), [selectedVehicle]);
  const monthlyAmt = useMemo(() => inferMonthlyAmt(selectedVehicle), [selectedVehicle]);
  const hourlyRate = useMemo(() => inferHourlyRate(selectedVehicle), [selectedVehicle]);

  const workingHour = (r: EntryRow) => Math.max(0, n(r.endMeter) - n(r.startMeter));

  const generatedAmt = (r: EntryRow) => {
    const wh = workingHour(r);

    if (billingType === "MONTHLY") {
      // monthly/30
      const perDay = monthlyAmt > 0 ? monthlyAmt / 30 : 0;
      return perDay;
    }
    if (billingType === "HOURLY") {
      return wh * hourlyRate;
    }

    // UNKNOWN fallback:
    // if hourlyRate available -> treat hourly, else 0
    if (hourlyRate > 0) return wh * hourlyRate;
    if (monthlyAmt > 0) return monthlyAmt / 30;
    return 0;
  };

  const balance = (r: EntryRow) => generatedAmt(r) - n(r.paymentAmt);

  const rowValid = (r: EntryRow) => {
    if (!r.entryDate) return false;
    if (n(r.endMeter) < n(r.startMeter)) return false;
    if (n(r.dieselLtr) < 0) return false;
    if (n(r.dieselAmt) < 0) return false;
    if (n(r.paymentAmt) < 0) return false;
    // meters can be empty? keep strict: start/end should be present
    if (String(r.startMeter).trim() === "" || String(r.endMeter).trim() === "") return false;
    return true;
  };

  const canSave = useMemo(() => {
    if (!ownerLedgerId) return false; // owner must be selected
    if (!vehicleId || !siteId) return false;
    if (!rows.length) return false;
    return rows.every(rowValid);
  }, [ownerLedgerId, vehicleId, siteId, rows]);

  const stats = useMemo(() => {
    const totalGen = rows.reduce((a, r) => a + generatedAmt(r), 0);
    const totalPay = rows.reduce((a, r) => a + n(r.paymentAmt), 0);
    const totalBal = totalGen - totalPay;
    const ready = rows.filter(rowValid).length;
    return { totalGen, totalPay, totalBal, ready, count: rows.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, billingType, monthlyAmt, hourlyRate]);

  /* ================= SAVE ================= */
  const save = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      if (mode === "EDIT") {
        const r = rows[0];
        const payload: any = {
          vehicleId,
          siteId,
          entryDate: toISOFromYMD(r.entryDate),
          startMeter: n(r.startMeter),
          endMeter: n(r.endMeter),
          dieselLtr: n(r.dieselLtr),
          dieselAmt: n(r.dieselAmt),
          // backward compatible (old field)
          dieselExp: n(r.dieselAmt),

          generatedAmt: generatedAmt(r),
          paymentAmt: n(r.paymentAmt),
          remarks: r.remarks?.trim() || null,
        };

        const res = await fetch(`${API.logs}/${initial?.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Save failed");

        onSaved?.();
        onClose();
        return;
      }

      // CREATE: multi-row create (sequential to be safe)
      for (const r of rows) {
        const payload: any = {
          vehicleId,
          siteId,
          entryDate: toISOFromYMD(r.entryDate),
          startMeter: n(r.startMeter),
          endMeter: n(r.endMeter),
          dieselLtr: n(r.dieselLtr),
          dieselAmt: n(r.dieselAmt),
          // backward compatible (old field)
          dieselExp: n(r.dieselAmt),

          generatedAmt: generatedAmt(r),
          paymentAmt: n(r.paymentAmt),
          remarks: r.remarks?.trim() || null,
        };

        const res = await fetch(API.logs, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Save failed");
      }

      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      {/* ✅ Layout fix: full-height dialog + internal scroll (no broken popup) */}
      <DialogContent className="!max-w-[1200px] !h-[92vh] !p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>
            {mode === "CREATE" ? "Add Logbook Entries (Bulk)" : "Edit Logbook Entry"}
          </DialogTitle>
          <div className="text-xs text-muted-foreground">
            Rows: <b>{stats.count}</b> • Ready: <b>{stats.ready}</b>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          <div className="grid gap-4">
            {/* TOP CONTROLS */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Vehicle Owner (Ledger)</Label>
                  <select
                    className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                    value={ownerLedgerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setOwnerLedgerId(id);
                      // owner change -> reset vehicle selection
                      setVehicleId("");
                    }}
                  >
                    <option value="">Select owner</option>
                    {ownerOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-muted-foreground">
                    पहले owner चुनिए, फिर vehicle list filter होगी।
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Vehicle</Label>
                  <select
                    className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    disabled={!ownerLedgerId}
                  >
                    <option value="">
                      {!ownerLedgerId ? "Select owner first" : "Select vehicle"}
                    </option>
                    {filteredVehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNo} — {v.vehicleName}
                      </option>
                    ))}
                  </select>

                  {selectedVehicle ? (
                    <div className="text-[11px] text-muted-foreground">
                      Billing:{" "}
                      <b>
                        {billingType === "MONTHLY"
                          ? `Monthly (₹${monthlyAmt || 0}/month → ₹${(monthlyAmt / 30 || 0).toFixed(2)}/day)`
                          : billingType === "HOURLY"
                          ? `Hourly (₹${hourlyRate || 0}/hour)`
                          : `Auto (Monthly: ₹${monthlyAmt || 0}, Hourly: ₹${hourlyRate || 0})`}
                      </b>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      Vehicle select करने के बाद amount auto calculate होगा।
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Site</Label>
                  <select
                    className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    disabled={!vehicleId}
                  >
                    <option value="">
                      {!vehicleId ? "Select vehicle first" : "Select site"}
                    </option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Total Generated: <b>₹ {stats.totalGen.toFixed(2)}</b> • Total Payment:{" "}
                  <b>₹ {stats.totalPay.toFixed(2)}</b> • Total Balance:{" "}
                  <b>₹ {stats.totalBal.toFixed(2)}</b>
                </div>

                {mode === "CREATE" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRow}
                    disabled={!vehicleId || !siteId}
                  >
                    + Row
                  </Button>
                ) : null}
              </div>
            </Card>

            {/* TABLE */}
            <Card className="rounded-xl border overflow-hidden">
              <div className="p-3 border-b bg-muted/40 text-sm font-medium">
                Entries
              </div>

              <div className="p-3">
                <div className="rounded-xl border bg-card/40 overflow-hidden">
                  <div className="overflow-auto" style={{ maxHeight: "52vh" }}>
                    <div style={{ overflowX: "auto" }}>
                      <div style={{ minWidth: 1250 }}>
                        <table className="w-full text-sm border-collapse">
                          <thead className="sticky top-0 z-20 bg-muted/80 border-b">
                            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {mode === "CREATE" ? (
                                <th className="px-2 py-2 w-12 text-center">#</th>
                              ) : null}
                              <th className="px-2 py-2 text-left">Date</th>
                              <th className="px-2 py-2 text-left">Start Meter</th>
                              <th className="px-2 py-2 text-left">End Meter</th>
                              <th className="px-2 py-2 text-left">Working Hour</th>
                              <th className="px-2 py-2 text-left">Diesel Ltr</th>
                              <th className="px-2 py-2 text-right">Amt (Auto)</th>
                              <th className="px-2 py-2 text-left">Diesel Amt</th>
                              <th className="px-2 py-2 text-left">Payment</th>
                              <th className="px-2 py-2 text-left">Remark</th>
                              <th className="px-2 py-2 text-left w-28">Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {rows.map((r, idx) => {
                              const ok = rowValid(r);
                              const wh = workingHour(r);
                              const amt = generatedAmt(r);
                              const bal = balance(r);

                              return (
                                <tr
                                  key={r.id}
                                  className={cn(
                                    "border-t transition",
                                    ok ? "bg-green-500/5" : "hover:bg-primary/5"
                                  )}
                                >
                                  {mode === "CREATE" ? (
                                    <td className="px-2 py-2 text-center align-top">
                                      <button
                                        type="button"
                                        onClick={() => removeRow(r.id)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition"
                                        title="Remove row"
                                      >
                                        ×
                                      </button>
                                      <div className="text-[10px] text-muted-foreground mt-1">
                                        {idx + 1}
                                      </div>
                                    </td>
                                  ) : null}

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      type="date"
                                      value={r.entryDate}
                                      onChange={(e) => patchRow(r.id, { entryDate: e.target.value })}
                                      className="h-8 w-40 text-sm"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={r.startMeter}
                                      onChange={(e) => patchRow(r.id, { startMeter: e.target.value })}
                                      inputMode="decimal"
                                      className="h-8 w-36 text-sm"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={r.endMeter}
                                      onChange={(e) => patchRow(r.id, { endMeter: e.target.value })}
                                      inputMode="decimal"
                                      className="h-8 w-36 text-sm"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={wh ? wh.toFixed(2) : ""}
                                      readOnly
                                      tabIndex={-1}
                                      className="h-8 w-36 text-sm"
                                    />
                                    {n(r.endMeter) < n(r.startMeter) ? (
                                      <div className="text-[10px] text-red-500 mt-1">
                                        End &lt; Start
                                      </div>
                                    ) : null}
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={r.dieselLtr}
                                      onChange={(e) => patchRow(r.id, { dieselLtr: e.target.value })}
                                      inputMode="decimal"
                                      className="h-8 w-28 text-sm"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top text-right">
                                    <Input
                                      value={amt ? amt.toFixed(2) : ""}
                                      readOnly
                                      tabIndex={-1}
                                      className="h-8 w-32 text-sm ml-auto"
                                    />
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                      Bal: ₹ {bal.toFixed(2)}
                                    </div>
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={r.dieselAmt}
                                      onChange={(e) => patchRow(r.id, { dieselAmt: e.target.value })}
                                      inputMode="decimal"
                                      className="h-8 w-32 text-sm"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={r.paymentAmt}
                                      onChange={(e) => patchRow(r.id, { paymentAmt: e.target.value })}
                                      inputMode="decimal"
                                      className="h-8 w-32 text-sm"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    <Input
                                      value={r.remarks}
                                      onChange={(e) => patchRow(r.id, { remarks: e.target.value })}
                                      className="h-8 w-56 text-sm"
                                      placeholder="Optional"
                                    />
                                  </td>

                                  <td className="px-2 py-2 align-top">
                                    {ok ? (
                                      <div className="text-green-600 text-xs font-medium">Ready</div>
                                    ) : (
                                      <div className="text-[11px] text-muted-foreground">Required</div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}

                            {!rows.length ? (
                              <tr>
                                <td
                                  colSpan={mode === "CREATE" ? 11 : 10}
                                  className="p-6 text-center text-muted-foreground"
                                >
                                  No rows
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground">
                  Amt auto: <b>Monthly</b> ⇒ monthly amount / 30 • <b>Hourly</b> ⇒ working hour × hourly rate
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FOOTER (sticky) */}
        <div className="p-4 border-t bg-background/60 backdrop-blur flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            Valid rows: <b>{stats.ready}</b> / {stats.count}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave || saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
