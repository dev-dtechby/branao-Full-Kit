"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PaymentMode } from "./types";
import { MODE_LABEL, PAYMENT_MODES } from "./constants";

export default function AddPaymentForm({
  disabled,
  payDate,
  setPayDate,
  payMode,
  setPayMode,
  particular,
  setParticular,
  amount,
  setAmount,
  canSave,
  onReset,
  onSave,
}: {
  disabled: boolean;

  payDate: Date | undefined;
  setPayDate: (d: Date | undefined) => void;

  payMode: PaymentMode;
  setPayMode: (m: PaymentMode) => void;

  particular: string;
  setParticular: (v: string) => void;

  amount: string;
  setAmount: (v: string) => void;

  canSave: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div className="border rounded-xl p-3 md:p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="font-semibold">Add Payment</div>
          <div className="text-xs text-muted-foreground">
            Date • Mode • Particular • Amount
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>

          <Button size="sm" disabled={!canSave} onClick={onSave} className="gap-2">
            <Plus className="h-4 w-4" />
            Save Payment
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Date */}
        <div className="space-y-1">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-10 w-full flex items-center justify-between px-3 rounded-md border bg-background text-sm"
                )}
                disabled={disabled}
              >
                {payDate ? payDate.toLocaleDateString() : "Select Date"}
                <CalendarIcon className="h-4 w-4 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar mode="single" selected={payDate} onSelect={setPayDate} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Mode */}
        <div className="space-y-1">
          <Label>Payment Mode</Label>
          <select
            className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
            value={payMode}
            disabled={disabled}
            onChange={(e) => setPayMode(e.target.value as PaymentMode)}
          >
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABEL[m]}
              </option>
            ))}
          </select>
        </div>

        {/* Particular */}
        <div className="space-y-1 md:col-span-1">
          <Label>Particular</Label>
          <Input
            className="h-10"
            disabled={disabled}
            placeholder="e.g. Advance paid / Bill payment..."
            value={particular}
            onChange={(e) => setParticular(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <Label>Amount</Label>
          <Input
            className="h-10"
            disabled={disabled}
            placeholder="Amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
