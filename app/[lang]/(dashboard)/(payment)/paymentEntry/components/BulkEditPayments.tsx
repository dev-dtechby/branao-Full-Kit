"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { PaymentMode, PaymentRow } from "./types";
import { MODE_LABEL, PAYMENT_MODES } from "./constants";
import { n } from "./utils";

export default function BulkEditPayments({
  rows,
  onCancel,
  onSaved,
  onUpdateOne,
}: {
  rows: PaymentRow[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
  onUpdateOne: (id: string, patch: Partial<PaymentRow>) => Promise<void>;
}) {
  const { toast } = useToast();

  const [formRows, setFormRows] = useState<(PaymentRow & { _dirty?: boolean })[]>(
    () => rows.map((r) => ({ ...r, _dirty: false }))
  );

  useEffect(() => {
    setFormRows(rows.map((r) => ({ ...r, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.id).join("|")]);

  const dirtyCount = useMemo(() => formRows.filter((r) => r._dirty).length, [formRows]);

  const updateRow = (id: string, patch: Partial<PaymentRow>) => {
    setFormRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  };

  const removeRow = (id: string) => {
    setFormRows((prev) => prev.filter((r) => r.id !== id));
  };

  const save = async () => {
    const dirty = formRows.filter((r) => r._dirty);
    if (!dirty.length) {
      toast({ title: "No changes", description: "Nothing to update." });
      return;
    }

    for (const r of dirty) {
      if (!r.paymentDate) {
        toast({ title: "Missing date", description: "Payment date required." });
        return;
      }
      if (!r.paymentMode) {
        toast({ title: "Missing mode", description: "Payment mode required." });
        return;
      }
      if (n(r.amount) <= 0) {
        toast({ title: "Invalid amount", description: "Amount must be > 0" });
        return;
      }
    }

    try {
      await Promise.all(
        dirty.map((r) =>
          onUpdateOne(r.id, {
            paymentDate: r.paymentDate,
            paymentMode: r.paymentMode,
            particular: r.particular ?? "",
            amount: n(r.amount),
          })
        )
      );
      toast({ title: "Updated", description: "Bulk update completed." });
      await onSaved();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Bulk update failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 md:px-6 py-4 border-b bg-background/60 backdrop-blur flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base md:text-lg font-semibold">Bulk Edit Payments</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Selected Rows: <b>{rows.length}</b> • Edited: <b>{dirtyCount}</b>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Close
          </Button>
          <Button size="sm" onClick={save} disabled={!dirtyCount} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="h-full min-h-0 overflow-auto p-3 md:p-4"
          style={{
            scrollbarGutter: "stable",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="rounded-xl border bg-card/40 overflow-hidden">
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 1200 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 w-12 text-center">#</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-left">Particular</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left w-20">Remove</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formRows.map((r, idx) => (
                      <tr key={r.id} className={cn("border-t", r._dirty ? "bg-primary/5" : "")}>
                        <td className="px-3 py-2 text-center text-muted-foreground">{idx + 1}</td>

                        <td className="px-3 py-2">
                          <Input
                            type="date"
                            className="h-9 w-44"
                            value={r.paymentDate?.slice(0, 10) || ""}
                            onChange={(e) =>
                              updateRow(r.id, { paymentDate: new Date(e.target.value).toISOString() })
                            }
                          />
                        </td>

                        <td className="px-3 py-2">
                          <select
                            className="border px-3 py-2 rounded-md bg-background w-44 h-9 text-sm"
                            value={r.paymentMode}
                            onChange={(e) =>
                              updateRow(r.id, { paymentMode: e.target.value as PaymentMode })
                            }
                          >
                            {PAYMENT_MODES.map((m) => (
                              <option key={m} value={m}>
                                {MODE_LABEL[m]}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-2">
                          <Input
                            className="h-9"
                            value={r.particular ?? ""}
                            placeholder="Particular..."
                            onChange={(e) => updateRow(r.id, { particular: e.target.value })}
                          />
                        </td>

                        <td className="px-3 py-2">
                          <Input
                            className="h-9 w-40"
                            inputMode="decimal"
                            value={String(r.amount ?? "")}
                            placeholder="Amount"
                            onChange={(e) => updateRow(r.id, { amount: Number(e.target.value || 0) })}
                          />
                        </td>

                        <td className="px-3 py-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => removeRow(r.id)}
                            title="Remove from bulk edit"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {!formRows.length && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          No rows selected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">Tip: Only edited rows will be updated.</div>
        </div>
      </div>
    </div>
  );
}
