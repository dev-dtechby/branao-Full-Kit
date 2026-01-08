"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentRow } from "./types";
import { MODE_LABEL } from "./constants";
import { formatDate, n } from "./utils";

export default function PaymentsTable({
  rows,
  loadingRows,
  selectedIds,
  allVisibleSelected,
  onToggleRow,
  onToggleSelectAllVisible,
  onEdit,
  onDelete,
}: {
  rows: PaymentRow[];
  loadingRows: boolean;

  selectedIds: Set<string>;
  allVisibleSelected: boolean;
  onToggleRow: (id: string) => void;
  onToggleSelectAllVisible: () => void;

  onEdit: (row: PaymentRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card/40 overflow-hidden">
      <div
        className="overflow-auto"
        style={{
          maxHeight: "62vh",
          scrollbarGutter: "stable",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1200 }}>
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={onToggleSelectAllVisible}
                      aria-label="Select all"
                      className="h-4 w-4 accent-primary border border-muted-foreground/40 rounded-sm"
                    />
                  </th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">DATE</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">MODE</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">PARTICULAR</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">AMOUNT</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap w-28">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {loadingRows ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : !rows.length ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No payments
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const checked = selectedIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "border-t hover:bg-primary/5",
                          checked ? "bg-primary/10" : ""
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleRow(r.id)}
                            aria-label={`Select row ${r.id}`}
                            className="h-4 w-4 accent-primary border border-muted-foreground/40 rounded-sm"
                          />
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">{formatDate(r.paymentDate)}</td>

                        <td className="px-3 py-3 whitespace-nowrap">{MODE_LABEL[r.paymentMode]}</td>

                        <td className="px-3 py-3">{r.particular || "-"}</td>

                        <td className="px-3 py-3 font-semibold whitespace-nowrap">
                          ₹ {n(r.amount).toFixed(2)}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => onEdit(r)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="outline"
                              className="border-destructive text-destructive"
                              onClick={() => onDelete(r.id)}
                              title="Delete"
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
  );
}
