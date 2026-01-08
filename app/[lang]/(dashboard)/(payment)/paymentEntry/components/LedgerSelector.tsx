"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown } from "lucide-react";
import { Ledger, LedgerType } from "./types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export default function LedgerSelector({
  ledgerTypes,
  loadingTypes,
  ledgerTypeId,
  onLedgerTypeChange,

  loadingLedgers,
  ledgerQuery,
  onLedgerQueryChange,
  ledgerSuggestions,
  selectedLedgerId,
  onBlurApplyLedgerByName,

  exportDisabled,
  onExportExcel,
  onExportPDF,
}: {
  ledgerTypes: LedgerType[];
  loadingTypes: boolean;
  ledgerTypeId: string;
  onLedgerTypeChange: (id: string) => void;

  loadingLedgers: boolean;
  ledgerQuery: string;
  onLedgerQueryChange: (val: string) => void;
  ledgerSuggestions: Ledger[];
  selectedLedgerId: string;
  onBlurApplyLedgerByName: (name: string) => void;

  exportDisabled: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
}) {
  return (
    <div className="w-full lg:w-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Ledger Type */}
        <div className="space-y-1">
          <Label>Select Ledger Type</Label>
          <select
            className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
            value={ledgerTypeId}
            onChange={(e) => onLedgerTypeChange(e.target.value)}
          >
            <option value="">
              {loadingTypes ? "Loading types..." : "Select Ledger Type"}
            </option>

            {/* ✅ Show All Ledgers */}
            <option value="ALL">Show All Ledgers</option>

            {ledgerTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Name */}
        <div className="space-y-1">
          <Label>Select Ledger</Label>
          <Input
            placeholder={
              loadingLedgers
                ? "Loading ledgers..."
                : ledgerTypeId
                ? "Type & select ledger..."
                : "Select ledger type first"
            }
            disabled={!ledgerTypeId}
            value={ledgerQuery}
            onChange={(e) => onLedgerQueryChange(e.target.value)}
            onBlur={() => {
              if (!selectedLedgerId && ledgerQuery) {
                onBlurApplyLedgerByName(ledgerQuery);
              }
            }}
            list="ledger_datalist"
            className="h-10"
          />

          <datalist id="ledger_datalist">
            {ledgerSuggestions.map((l) => (
              <option key={l.id} value={l.name} />
            ))}
          </datalist>

          <div className="text-[11px] text-muted-foreground">
            {selectedLedgerId
              ? "Ledger selected"
              : ledgerTypeId
              ? ledgerTypeId === "ALL"
                ? "Showing all ledgers"
                : "Type & select ledger"
              : "Select Ledger Type"}
          </div>
        </div>

        {/* ✅ Export (replaces Refresh) */}
        <div className="space-y-1">
          <Label className="opacity-0">Export</Label>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full flex items-center gap-2"
                disabled={exportDisabled}
              >
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-44 p-2">
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="justify-start"
                  onClick={onExportExcel}
                >
                  Export Excel
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="justify-start"
                  onClick={onExportPDF}
                >
                  Export PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
