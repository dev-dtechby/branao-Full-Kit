"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

import type {
  Site,
  FuelStation,
  FuelLedgerRow,
  PurchaseType,
  FuelType,
} from "./fuel-ledger.types";

/* ================= TYPES (LOCAL ONLY) ================= */
type EditableRow = {
  id: string;

  fuelStationId: string;
  siteId: string;

  entryDate: string; // yyyy-mm-dd

  slipNo: string;
  through: string;

  purchaseType: PurchaseType;

  vehicleNumber: string;
  vehicleName: string;

  fuelType: FuelType;

  qty: string; // numeric string
  rate: string; // numeric string

  remarks: string;
};

/* ================= CONSTS ================= */
const LEDGER_API_PATH = "/api/fuel-station-ledger";

/* ================= HELPERS ================= */
const cleanStr = (v: any) => String(v ?? "").trim();

const toInputDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toISO = (yyyyMMdd: string) => {
  const d = new Date(yyyyMMdd);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const num = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : NaN;
};

const normalizePurchaseType = (v: any): PurchaseType => {
  const s = cleanStr(v).toUpperCase();
  if (s === "OWN" || s === "OWN_VEHICLE") return "OWN_VEHICLE";
  if (s === "RENT" || s === "RENT_VEHICLE" || s === "RENTAL") return "RENT_VEHICLE";
  return "OWN_VEHICLE";
};

const normalizeFuelType = (v: any): FuelType => {
  const s = cleanStr(v);
  const allowed: FuelType[] = ["Diesel", "Petrol", "CNG", "LPG", "AdBlue", "Other"];
  return allowed.includes(s as FuelType) ? (s as FuelType) : "Diesel";
};

const normalizeRow = (r: EditableRow) => ({
  fuelStationId: cleanStr(r.fuelStationId),
  siteId: cleanStr(r.siteId),
  entryDate: cleanStr(r.entryDate),

  slipNo: cleanStr(r.slipNo),
  through: cleanStr(r.through),

  purchaseType: cleanStr(r.purchaseType),

  vehicleNumber: cleanStr(r.vehicleNumber),
  vehicleName: cleanStr(r.vehicleName),

  fuelType: cleanStr(r.fuelType),

  qty: cleanStr(r.qty),
  rate: cleanStr(r.rate),

  remarks: cleanStr(r.remarks),
});

/* ================= COMPONENT ================= */
export default function EditFuelLedgerTable(props: {
  rows: FuelLedgerRow[];
  sites: Site[];
  fuelStations: FuelStation[];
  baseUrl: string;

  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const {
    rows = [],
    sites = [],
    fuelStations = [],
    baseUrl,
    onCancel,
    onSaved,
  } = props;

  const LEDGER_API = useMemo(() => `${baseUrl}${LEDGER_API_PATH}`, [baseUrl]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formRows, setFormRows] = useState<EditableRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const originalMapRef = useRef<Record<string, EditableRow>>({});

  useEffect(() => {
    setErrors({});

    const mapped: EditableRow[] = (rows ?? []).map((r) => ({
      id: r.id,

      fuelStationId: cleanStr(r.fuelStationId ?? r.fuelStation?.id ?? ""),
      siteId: cleanStr(r.siteId ?? r.site?.id ?? ""),

      entryDate: toInputDate(String(r.entryDate ?? "")),

      slipNo: cleanStr(r.slipNo),
      through: cleanStr(r.through),

      purchaseType: normalizePurchaseType(r.purchaseType),

      vehicleNumber: cleanStr(r.vehicleNumber),
      vehicleName: cleanStr(r.vehicleName),

      fuelType: normalizeFuelType(r.fuelType),

      qty: r.qty == null ? "" : String(r.qty),
      rate: r.rate == null ? "" : String(r.rate),

      remarks: cleanStr(r.remarks),
    }));

    setFormRows(mapped);
    setDirtyIds(new Set());

    const snap: Record<string, EditableRow> = {};
    mapped.forEach((m) => (snap[m.id] = m));
    originalMapRef.current = snap;
  }, [rows]);

  const markDirtyIfChanged = (rowId: string, nextRow: EditableRow) => {
    const original = originalMapRef.current[rowId];
    if (!original) return;

    const a = normalizeRow(original);
    const b = normalizeRow(nextRow);

    const changed =
      a.fuelStationId !== b.fuelStationId ||
      a.siteId !== b.siteId ||
      a.entryDate !== b.entryDate ||
      a.slipNo !== b.slipNo ||
      a.through !== b.through ||
      a.purchaseType !== b.purchaseType ||
      a.vehicleNumber !== b.vehicleNumber ||
      a.vehicleName !== b.vehicleName ||
      a.fuelType !== b.fuelType ||
      a.qty !== b.qty ||
      a.rate !== b.rate ||
      a.remarks !== b.remarks;

    setDirtyIds((prev) => {
      const next = new Set(prev);
      if (changed) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const updateRow = (id: string, patch: Partial<EditableRow>) => {
    setFormRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextRow = { ...r, ...patch };
        markDirtyIfChanged(id, nextRow);
        return nextRow;
      })
    );
  };

  const removeRow = (id: string) => {
    setFormRows((prev) => prev.filter((r) => r.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const resetAllChanges = () => {
    const snap = originalMapRef.current;
    setFormRows((prev) => prev.map((r) => snap[r.id] || r));
    setErrors({});
    setDirtyIds(new Set());
  };

  const validateOnly = (rowsToValidate: EditableRow[]) => {
    const nextErr: Record<string, string> = {};

    for (const r of rowsToValidate) {
      if (!cleanStr(r.fuelStationId)) nextErr[r.id] = "Fuel Station required";
      else if (!cleanStr(r.siteId)) nextErr[r.id] = "Site required";
      else if (!cleanStr(r.entryDate)) nextErr[r.id] = "Date required";
      else if (!cleanStr(r.slipNo)) nextErr[r.id] = "Slip/Receipt No required";
      else if (!cleanStr(r.through)) nextErr[r.id] = "Through required";
      else if (!cleanStr(r.vehicleNumber)) nextErr[r.id] = "Vehicle Number required";
      else if (!cleanStr(r.vehicleName)) nextErr[r.id] = "Vehicle required";
      else if (!cleanStr(r.fuelType)) nextErr[r.id] = "Fuel Type required";
      else {
        const q = num(r.qty);
        const rt = num(r.rate);
        if (!Number.isFinite(q) || q <= 0) nextErr[r.id] = "Qty must be > 0";
        else if (!Number.isFinite(rt) || rt <= 0) nextErr[r.id] = "Rate must be > 0";
      }
    }

    setErrors((prev) => {
      const cleaned: Record<string, string> = {};
      for (const k of Object.keys(prev)) {
        if (!rowsToValidate.find((x) => x.id === k)) cleaned[k] = prev[k];
      }
      return { ...cleaned, ...nextErr };
    });

    return Object.keys(nextErr).length === 0;
  };

  const saveEditedOnly = async () => {
    const editedRows = formRows.filter((r) => dirtyIds.has(r.id));

    if (editedRows.length === 0) {
      alert("No changes to update.");
      return;
    }
    if (!validateOnly(editedRows)) return;

    try {
      setSaving(true);

      await Promise.all(
        editedRows.map(async (r) => {
          const iso = toISO(r.entryDate);
          if (!iso) throw new Error(`Invalid date for id ${r.id}`);

          const q = num(r.qty);
          const rt = num(r.rate);
          const amount = Number.isFinite(q) && Number.isFinite(rt) ? q * rt : null;

          const payload = {
            fuelStationId: cleanStr(r.fuelStationId),
            siteId: cleanStr(r.siteId),
            entryDate: iso,

            slipNo: cleanStr(r.slipNo),
            through: cleanStr(r.through),

            purchaseType: r.purchaseType,

            vehicleNumber: cleanStr(r.vehicleNumber),
            vehicleName: cleanStr(r.vehicleName),

            fuelType: r.fuelType,

            qty: q,
            rate: rt,
            amount,

            remarks: cleanStr(r.remarks) ? cleanStr(r.remarks) : null,
          };

          const res = await fetch(`${LEDGER_API}/${r.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

          const json = await res.json().catch(() => null);
          if (!res.ok) throw new Error(json?.message || `Update failed for id ${r.id}`);
        })
      );

      setDirtyIds(new Set());
      await onSaved?.();
    } catch (e: any) {
      alert(e?.message || "Bulk update failed");
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const editedCount = dirtyIds.size;

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* TOP BAR */}
      <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3 border-b bg-background/60 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            Bulk Edit Fuel Ledger ({formRows.length})
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 flex flex-col gap-3">
          <div className="text-xs text-muted-foreground">
            Header freeze रहेगा, sirf rows scroll होंगी. Update = sirf edited rows.
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="flex flex-wrap items-center gap-2 min-w-max">
              <span className="px-2 py-1 rounded-md border bg-muted/30 text-xs">
                Selected: <b>{formRows.length}</b>
              </span>
              <span className="px-2 py-1 rounded-md border bg-muted/30 text-xs">
                Edited: <b>{editedCount}</b>
              </span>
              <span
                className={`px-2 py-1 rounded-md border text-xs ${
                  errorCount ? "border-red-500/40 bg-red-500/10" : "bg-muted/30"
                }`}
              >
                Errors: <b>{errorCount}</b>
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={resetAllChanges}
                disabled={saving || editedCount === 0}
              >
                Reset
              </Button>

              <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={saveEditedOnly}
                disabled={saving || editedCount === 0 || formRows.length === 0}
              >
                {saving ? "Updating..." : `Update (${editedCount})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ONLY THIS AREA SCROLLS */}
      <div className="flex-1 min-h-0 p-3 md:p-4">
        <div className="h-full min-h-0 rounded-xl border bg-card/40 overflow-hidden flex flex-col">
          <div
            className="flex-1 min-h-0 overflow-auto"
            style={{
              scrollbarGutter: "stable",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 2200 }}>
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                      <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-3 text-center w-10"></th>
                        <th className="px-3 py-3 text-left w-56">Fuel Station</th>
                        <th className="px-3 py-3 text-left w-56">Site</th>
                        <th className="px-3 py-3 text-left w-44">Date</th>
                        <th className="px-3 py-3 text-left w-44">Slip/Receipt No</th>
                        <th className="px-3 py-3 text-left w-56">Through</th>
                        <th className="px-3 py-3 text-left w-44">Purchase Type</th>
                        <th className="px-3 py-3 text-left w-48">Vehicle Number</th>
                        <th className="px-3 py-3 text-left w-48">Vehicle</th>
                        <th className="px-3 py-3 text-left w-36">Fuel Type</th>
                        <th className="px-3 py-3 text-right w-28">Qty</th>
                        <th className="px-3 py-3 text-right w-28">Rate</th>
                        <th className="px-3 py-3 text-right w-32">Amount</th>
                        <th className="px-3 py-3 text-left w-64">Remark</th>
                        <th className="px-3 py-3 text-left w-56">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {formRows.map((r) => {
                        const isDirty = dirtyIds.has(r.id);
                        const q = num(r.qty);
                        const rt = num(r.rate);
                        const amt = Number.isFinite(q) && Number.isFinite(rt) ? q * rt : null;

                        return (
                          <tr
                            key={r.id}
                            className={`border-t transition ${
                              isDirty ? "bg-primary/10" : "hover:bg-primary/5"
                            }`}
                          >
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(r.id)}
                                disabled={saving}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition disabled:opacity-50"
                                title="Remove row"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>

                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-56"
                                value={r.fuelStationId}
                                onChange={(e) => updateRow(r.id, { fuelStationId: e.target.value })}
                                disabled={saving}
                              >
                                <option value="">Select Fuel Station</option>
                                {(fuelStations ?? []).map((fs) => (
                                  <option key={fs.id} value={fs.id}>
                                    {fs.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-56"
                                value={r.siteId}
                                onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                                disabled={saving}
                              >
                                <option value="">Select Site</option>
                                {(sites ?? []).map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.siteName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                type="date"
                                value={r.entryDate}
                                onChange={(e) => updateRow(r.id, { entryDate: e.target.value })}
                                disabled={saving}
                                className="w-44"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.slipNo}
                                onChange={(e) => updateRow(r.id, { slipNo: e.target.value })}
                                disabled={saving}
                                className="w-44"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.through}
                                onChange={(e) => updateRow(r.id, { through: e.target.value })}
                                disabled={saving}
                                className="w-56"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-44"
                                value={r.purchaseType}
                                onChange={(e) =>
                                  updateRow(r.id, { purchaseType: e.target.value as PurchaseType })
                                }
                                disabled={saving}
                              >
                                <option value="OWN_VEHICLE">Own Vehicle</option>
                                <option value="RENT_VEHICLE">Rent Vehicle</option>
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.vehicleNumber}
                                onChange={(e) => updateRow(r.id, { vehicleNumber: e.target.value })}
                                disabled={saving}
                                className="w-48"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.vehicleName}
                                onChange={(e) => updateRow(r.id, { vehicleName: e.target.value })}
                                disabled={saving}
                                className="w-48"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-36"
                                value={r.fuelType}
                                onChange={(e) => updateRow(r.id, { fuelType: e.target.value as FuelType })}
                                disabled={saving}
                              >
                                <option value="Diesel">Diesel</option>
                                <option value="Petrol">Petrol</option>
                                <option value="CNG">CNG</option>
                                <option value="LPG">LPG</option>
                                <option value="AdBlue">AdBlue</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Input
                                value={r.qty}
                                onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                                disabled={saving}
                                className="w-28 text-right"
                                inputMode="decimal"
                              />
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Input
                                value={r.rate}
                                onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                                disabled={saving}
                                className="w-28 text-right"
                                inputMode="decimal"
                              />
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Input
                                value={amt == null ? "" : amt.toFixed(2)}
                                readOnly
                                tabIndex={-1}
                                className="w-32 text-right"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.remarks}
                                onChange={(e) => updateRow(r.id, { remarks: e.target.value })}
                                disabled={saving}
                                className="w-64"
                              />
                            </td>

                            <td className="px-3 py-3">
                              {errors[r.id] ? (
                                <span className="text-xs text-red-400">{errors[r.id]}</span>
                              ) : isDirty ? (
                                <span className="text-xs text-yellow-400">Edited</span>
                              ) : (
                                <span className="text-xs text-green-400">OK</span>
                              )}
                              <div className="text-[10px] text-muted-foreground mt-1">ID: {r.id}</div>
                            </td>
                          </tr>
                        );
                      })}

                      {formRows.length === 0 && (
                        <tr>
                          <td colSpan={15} className="p-6 text-center text-muted-foreground">
                            No rows selected
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden p-3 space-y-3">
              {formRows.map((r, idx) => {
                const isDirty = dirtyIds.has(r.id);

                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border bg-background/20 p-3 space-y-2 ${
                      errors[r.id]
                        ? "border-red-500/40"
                        : isDirty
                        ? "border-yellow-500/40"
                        : "border-border/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Row {idx + 1}{" "}
                        {isDirty && <span className="ml-2 text-yellow-400">• Edited</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        disabled={saving}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition disabled:opacity-50"
                        title="Remove row"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-2">
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Fuel Station</div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={r.fuelStationId}
                          onChange={(e) => updateRow(r.id, { fuelStationId: e.target.value })}
                          disabled={saving}
                        >
                          <option value="">Select Fuel Station</option>
                          {(fuelStations ?? []).map((fs) => (
                            <option key={fs.id} value={fs.id}>
                              {fs.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Site</div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={r.siteId}
                          onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                          disabled={saving}
                        >
                          <option value="">Select Site</option>
                          {(sites ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.siteName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Date</div>
                          <Input
                            type="date"
                            value={r.entryDate}
                            onChange={(e) => updateRow(r.id, { entryDate: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Slip/Receipt</div>
                          <Input
                            value={r.slipNo}
                            onChange={(e) => updateRow(r.id, { slipNo: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Through</div>
                        <Input
                          value={r.through}
                          onChange={(e) => updateRow(r.id, { through: e.target.value })}
                          disabled={saving}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Purchase</div>
                          <select
                            className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                            value={r.purchaseType}
                            onChange={(e) =>
                              updateRow(r.id, { purchaseType: e.target.value as PurchaseType })
                            }
                            disabled={saving}
                          >
                            <option value="OWN_VEHICLE">Own</option>
                            <option value="RENT_VEHICLE">Rent</option>
                          </select>
                        </div>

                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Fuel Type</div>
                          <select
                            className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                            value={r.fuelType}
                            onChange={(e) =>
                              updateRow(r.id, { fuelType: e.target.value as FuelType })
                            }
                            disabled={saving}
                          >
                            <option value="Diesel">Diesel</option>
                            <option value="Petrol">Petrol</option>
                            <option value="CNG">CNG</option>
                            <option value="LPG">LPG</option>
                            <option value="AdBlue">AdBlue</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Vehicle Number</div>
                          <Input
                            value={r.vehicleNumber}
                            onChange={(e) => updateRow(r.id, { vehicleNumber: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Vehicle</div>
                          <Input
                            value={r.vehicleName}
                            onChange={(e) => updateRow(r.id, { vehicleName: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Qty</div>
                          <Input
                            value={r.qty}
                            onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                            disabled={saving}
                            inputMode="decimal"
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Rate</div>
                          <Input
                            value={r.rate}
                            onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                            disabled={saving}
                            inputMode="decimal"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Remark</div>
                        <Input
                          value={r.remarks}
                          onChange={(e) => updateRow(r.id, { remarks: e.target.value })}
                          disabled={saving}
                        />
                      </div>

                      <div>
                        {errors[r.id] ? (
                          <span className="text-xs text-red-400">{errors[r.id]}</span>
                        ) : isDirty ? (
                          <span className="text-xs text-yellow-400">Edited</span>
                        ) : (
                          <span className="text-xs text-green-400">OK</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {formRows.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">No rows selected</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
