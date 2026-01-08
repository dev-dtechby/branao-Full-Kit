"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { PaymentMode, PaymentRow } from "./types";
import { MODE_LABEL, PAYMENT_MODES } from "./constants";

export default function EditPaymentDialog({
  open,
  onOpenChange,
  editRow,
  setEditRow,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  editRow: PaymentRow | null;
  setEditRow: React.Dispatch<React.SetStateAction<PaymentRow | null>>;

  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          !p-0 overflow-hidden
          !h-[78vh] !w-[96vw] !max-w-[96vw] md:!max-w-2xl
          !flex !flex-col
        "
      >
        <div className="h-full min-h-0 flex flex-col">
          <DialogHeader className="shrink-0 px-4 md:px-6 py-4 border-b bg-background/60 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base md:text-lg font-semibold">
                Edit Payment
              </DialogTitle>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            <div
              className="h-full min-h-0 overflow-auto p-4 md:p-6"
              style={{
                scrollbarGutter: "stable",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              {!editRow ? null : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={editRow.paymentDate?.slice(0, 10) || ""}
                        onChange={(e) =>
                          setEditRow((p) =>
                            p
                              ? { ...p, paymentDate: new Date(e.target.value).toISOString() }
                              : p
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Payment Mode</Label>
                      <select
                        className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
                        value={editRow.paymentMode}
                        onChange={(e) =>
                          setEditRow((p) =>
                            p ? { ...p, paymentMode: e.target.value as PaymentMode } : p
                          )
                        }
                      >
                        {PAYMENT_MODES.map((m) => (
                          <option key={m} value={m}>
                            {MODE_LABEL[m]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Particular</Label>
                    <Input
                      className="h-10"
                      value={editRow.particular ?? ""}
                      onChange={(e) =>
                        setEditRow((p) => (p ? { ...p, particular: e.target.value } : p))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input
                      className="h-10"
                      inputMode="decimal"
                      value={String(editRow.amount ?? "")}
                      onChange={(e) =>
                        setEditRow((p) =>
                          p ? { ...p, amount: Number(e.target.value || 0) } : p
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button onClick={onSave} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
