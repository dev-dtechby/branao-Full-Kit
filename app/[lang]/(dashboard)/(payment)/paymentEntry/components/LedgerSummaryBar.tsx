"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Ledger } from "./types";
import { n } from "./utils";

export default function LedgerSummaryBar({
  selectedLedger,
  totalPaid,
  selectedCount,
  onOpenBulkEdit,
  onOpenBulkDelete,
}: {
  selectedLedger: Ledger | null;
  totalPaid: number;
  selectedCount: number;
  onOpenBulkEdit: () => void;
  onOpenBulkDelete: () => void;
}) {
  return (
    <div className="border rounded-xl p-3 md:p-4 bg-background/20">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Selected Ledger</div>
          <div className="text-lg font-semibold truncate">{selectedLedger?.name || "-"}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {selectedLedger?.mobile ? `Mobile: ${selectedLedger.mobile}` : ""}
            {selectedLedger?.site?.siteName ? ` • Site: ${selectedLedger.site.siteName}` : ""}
          </div>
          {selectedLedger?.address ? (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {selectedLedger.address}
            </div>
          ) : null}
        </div>

        {/* ✅ Bulk buttons left of Opening + smaller */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-end gap-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:self-center">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount === 0}
              onClick={onOpenBulkEdit}
              className="h-9 px-3 text-xs"
            >
              Bulk Edit ({selectedCount})
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount === 0}
              onClick={onOpenBulkDelete}
              className="h-9 px-3 text-xs border-destructive text-destructive"
            >
              Bulk Delete ({selectedCount})
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2 rounded-lg border bg-green-100/70 dark:bg-green-900/30">
              <div className="text-[10px] text-default-700">Opening</div>
              <div className="font-bold text-green-700 dark:text-green-300">
                ₹ {n(selectedLedger?.openingBalance).toFixed(2)}
              </div>
            </div>

            <div className="p-2 rounded-lg border bg-blue-100/70 dark:bg-blue-900/30">
              <div className="text-[10px] text-default-700">Closing</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">
                ₹ {n(selectedLedger?.closingBalance).toFixed(2)}
              </div>
            </div>

            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[10px] text-default-700">Total Paid</div>
              <div className="font-bold">₹ {totalPaid.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
