"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Site = { id: string; siteName: string };

type LedgerRow = {
  id: string;
  entryDate: string; // ISO

  // ✅ IMPORTANT: backend mostly returns siteId (relation include may not come)
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

type EditableRow = {
  id: string;

  siteId: string;
  entryDate: string; // yyyy-mm-dd

  receiptNo: string;
  parchiPhoto: string;
  otp: string;

  vehicleNo: string;
  vehiclePhoto: string;

  material: string;
  size: string;

  qty: string;
  rate: string;

  royaltyQty: string;
  royaltyRate: string;
  royaltyAmt: string;

  gstPercent: string;
  taxAmt: string;
  totalAmt: string;

  paymentAmt: string;
  balanceAmt: string;
};

const LEDGER_API_PATH = "/api/material-supplier-ledger";

const toInputDate = (val: string) => {
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const cleanStr = (v: any) => String(v ?? "").trim();

const toNullableStr = (v: any) => {
  const s = cleanStr(v);
  return s.length ? s : null;
};

const toOptionalNumber = (v: any) => {
  const s = cleanStr(v);
  if (!s) return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
};

const toRequiredNumber = (v: any) => {
  const x = Number(cleanStr(v));
  return Number.isFinite(x) ? x : 0;
};

const normalizeRow = (r: EditableRow) => ({
  siteId: cleanStr(r.siteId),
  entryDate: cleanStr(r.entryDate),

  receiptNo: cleanStr(r.receiptNo),
  parchiPhoto: cleanStr(r.parchiPhoto),
  otp: cleanStr(r.otp),

  vehicleNo: cleanStr(r.vehicleNo),
  vehiclePhoto: cleanStr(r.vehiclePhoto),

  material: cleanStr(r.material),
  size: cleanStr(r.size),

  qty: cleanStr(r.qty),
  rate: cleanStr(r.rate),

  royaltyQty: cleanStr(r.royaltyQty),
  royaltyRate: cleanStr(r.royaltyRate),
  royaltyAmt: cleanStr(r.royaltyAmt),

  gstPercent: cleanStr(r.gstPercent),
  taxAmt: cleanStr(r.taxAmt),
  totalAmt: cleanStr(r.totalAmt),

  paymentAmt: cleanStr(r.paymentAmt),
  balanceAmt: cleanStr(r.balanceAmt),
});

export default function EditMaterialLedgerTable(props: {
  rows: LedgerRow[];
  sites: Site[];
  baseUrl: string;
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { rows, sites, baseUrl, onCancel, onSaved } = props;

  const LEDGER_API = useMemo(() => `${baseUrl}${LEDGER_API_PATH}`, [baseUrl]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formRows, setFormRows] = useState<EditableRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const originalMapRef = useRef<Record<string, EditableRow>>({});

  useEffect(() => {
    setErrors({});

    const mapped: EditableRow[] = rows.map((r) => ({
      id: r.id,

      // ✅ FIX: pick siteId first, else fallback to relation id
      siteId: cleanStr(r.siteId ?? r.site?.id ?? ""),
      entryDate: toInputDate(r.entryDate),

      receiptNo: cleanStr(r.receiptNo),
      parchiPhoto: cleanStr(r.parchiPhoto),
      otp: cleanStr(r.otp),

      vehicleNo: cleanStr(r.vehicleNo),
      vehiclePhoto: cleanStr(r.vehiclePhoto),

      material: cleanStr(r.material),
      size: cleanStr(r.size),

      qty: String(r.qty ?? ""),
      rate: String(r.rate ?? ""),

      royaltyQty: r.royaltyQty == null ? "" : String(r.royaltyQty),
      royaltyRate: r.royaltyRate == null ? "" : String(r.royaltyRate),
      royaltyAmt: r.royaltyAmt == null ? "" : String(r.royaltyAmt),

      gstPercent: r.gstPercent == null ? "" : String(r.gstPercent),
      taxAmt: r.taxAmt == null ? "" : String(r.taxAmt),
      totalAmt: r.totalAmt == null ? "" : String(r.totalAmt),

      paymentAmt: r.paymentAmt == null ? "" : String(r.paymentAmt),
      balanceAmt: r.balanceAmt == null ? "" : String(r.balanceAmt),
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
      a.siteId !== b.siteId ||
      a.entryDate !== b.entryDate ||
      a.receiptNo !== b.receiptNo ||
      a.parchiPhoto !== b.parchiPhoto ||
      a.otp !== b.otp ||
      a.vehicleNo !== b.vehicleNo ||
      a.vehiclePhoto !== b.vehiclePhoto ||
      a.material !== b.material ||
      a.size !== b.size ||
      a.qty !== b.qty ||
      a.rate !== b.rate ||
      a.royaltyQty !== b.royaltyQty ||
      a.royaltyRate !== b.royaltyRate ||
      a.royaltyAmt !== b.royaltyAmt ||
      a.gstPercent !== b.gstPercent ||
      a.taxAmt !== b.taxAmt ||
      a.totalAmt !== b.totalAmt ||
      a.paymentAmt !== b.paymentAmt ||
      a.balanceAmt !== b.balanceAmt;

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
      if (!r.siteId) nextErr[r.id] = "Site required";
      else if (!r.entryDate) nextErr[r.id] = "Date required";
      else if (!cleanStr(r.material)) nextErr[r.id] = "Material required";
      else {
        const qty = Number(cleanStr(r.qty));
        if (!qty || isNaN(qty) || qty <= 0) nextErr[r.id] = "Qty must be > 0";
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
          const payload: any = {
            siteId: r.siteId,
            entryDate: new Date(r.entryDate).toISOString(),

            receiptNo: toNullableStr(r.receiptNo),
            parchiPhoto: toNullableStr(r.parchiPhoto),
            otp: toNullableStr(r.otp),

            vehicleNo: toNullableStr(r.vehicleNo),
            vehiclePhoto: toNullableStr(r.vehiclePhoto),

            material: cleanStr(r.material),
            size: toNullableStr(r.size),

            qty: toRequiredNumber(r.qty),
            rate: toRequiredNumber(r.rate),

            royaltyQty: toOptionalNumber(r.royaltyQty),
            royaltyRate: toOptionalNumber(r.royaltyRate),
            royaltyAmt: toOptionalNumber(r.royaltyAmt),

            gstPercent: toOptionalNumber(r.gstPercent),
            taxAmt: toOptionalNumber(r.taxAmt),
            totalAmt: toOptionalNumber(r.totalAmt),

            paymentAmt: toOptionalNumber(r.paymentAmt),
            balanceAmt: toOptionalNumber(r.balanceAmt),
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
            Bulk Edit Material Ledger ({formRows.length})
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
              <div className="min-w-[2400px]">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-3 text-center w-10"></th>
                      <th className="px-3 py-3 text-left w-56">Site</th>
                      <th className="px-3 py-3 text-left w-44">Date</th>
                      <th className="px-3 py-3 text-left w-44">Receipt No</th>
                      <th className="px-3 py-3 text-left w-80">Parchi Photo URL</th>
                      <th className="px-3 py-3 text-left w-32">OTP</th>
                      <th className="px-3 py-3 text-left w-44">Vehicle No</th>
                      <th className="px-3 py-3 text-left w-80">Vehicle Photo URL</th>
                      <th className="px-3 py-3 text-left w-56">Material</th>
                      <th className="px-3 py-3 text-left w-36">Size</th>
                      <th className="px-3 py-3 text-right w-36">Qty</th>
                      <th className="px-3 py-3 text-right w-36">Rate</th>
                      <th className="px-3 py-3 text-right w-36">Royalty Qty</th>
                      <th className="px-3 py-3 text-right w-36">Royalty Rate</th>
                      <th className="px-3 py-3 text-right w-36">Royalty Amt</th>
                      <th className="px-3 py-3 text-right w-28">GST%</th>
                      <th className="px-3 py-3 text-right w-36">Tax Amt</th>
                      <th className="px-3 py-3 text-right w-36">Total</th>
                      <th className="px-3 py-3 text-right w-36">Payment</th>
                      <th className="px-3 py-3 text-right w-36">Balance</th>
                      <th className="px-3 py-3 text-left w-56">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formRows.map((r) => {
                      const isDirty = dirtyIds.has(r.id);

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
                              value={r.siteId}
                              onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                              disabled={saving}
                            >
                              <option value="">Select Site</option>
                              {sites.map((s) => (
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
                              value={r.receiptNo}
                              onChange={(e) => updateRow(r.id, { receiptNo: e.target.value })}
                              disabled={saving}
                              className="w-44"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={r.parchiPhoto}
                                onChange={(e) => updateRow(r.id, { parchiPhoto: e.target.value })}
                                disabled={saving}
                                className="w-[520px]"
                              />
                              {!!r.parchiPhoto && (
                                <a
                                  className="text-xs underline text-primary whitespace-nowrap"
                                  href={r.parchiPhoto}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.otp}
                              onChange={(e) => updateRow(r.id, { otp: e.target.value })}
                              disabled={saving}
                              className="w-32"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.vehicleNo}
                              onChange={(e) => updateRow(r.id, { vehicleNo: e.target.value })}
                              disabled={saving}
                              className="w-44"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={r.vehiclePhoto}
                                onChange={(e) => updateRow(r.id, { vehiclePhoto: e.target.value })}
                                disabled={saving}
                                className="w-[520px]"
                              />
                              {!!r.vehiclePhoto && (
                                <a
                                  className="text-xs underline text-primary whitespace-nowrap"
                                  href={r.vehiclePhoto}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.material}
                              onChange={(e) => updateRow(r.id, { material: e.target.value })}
                              disabled={saving}
                              className="w-56"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.size}
                              onChange={(e) => updateRow(r.id, { size: e.target.value })}
                              disabled={saving}
                              className="w-36"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.qty}
                              onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.rate}
                              onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.royaltyQty}
                              onChange={(e) => updateRow(r.id, { royaltyQty: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.royaltyRate}
                              onChange={(e) => updateRow(r.id, { royaltyRate: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.royaltyAmt}
                              onChange={(e) => updateRow(r.id, { royaltyAmt: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.gstPercent}
                              onChange={(e) => updateRow(r.id, { gstPercent: e.target.value })}
                              disabled={saving}
                              className="w-28 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.taxAmt}
                              onChange={(e) => updateRow(r.id, { taxAmt: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.totalAmt}
                              onChange={(e) => updateRow(r.id, { totalAmt: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.paymentAmt}
                              onChange={(e) => updateRow(r.id, { paymentAmt: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.balanceAmt}
                              onChange={(e) => updateRow(r.id, { balanceAmt: e.target.value })}
                              disabled={saving}
                              className="w-36 text-right"
                              inputMode="decimal"
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
                        <td colSpan={21} className="p-6 text-center text-muted-foreground">
                          No rows selected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                        <div className="text-[11px] text-muted-foreground mb-1">Site</div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={r.siteId}
                          onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                          disabled={saving}
                        >
                          <option value="">Select Site</option>
                          {sites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.siteName}
                            </option>
                          ))}
                        </select>
                      </div>

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
                        <div className="text-[11px] text-muted-foreground mb-1">Material</div>
                        <Input
                          value={r.material}
                          onChange={(e) => updateRow(r.id, { material: e.target.value })}
                          disabled={saving}
                        />
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
                        {errors[r.id] ? (
                          <span className="text-xs text-red-400">{errors[r.id]}</span>
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
