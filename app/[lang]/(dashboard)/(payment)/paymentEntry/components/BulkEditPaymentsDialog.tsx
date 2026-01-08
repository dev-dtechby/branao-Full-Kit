"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PaymentRow } from "./types";
import BulkEditPayments from "./BulkEditPayments";

export default function BulkEditPaymentsDialog({
  open,
  onOpenChange,
  rows,
  onCancel,
  onUpdateOne,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  rows: PaymentRow[];
  onCancel: () => void;

  onUpdateOne: (id: string, patch: Partial<PaymentRow>) => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          !w-[98vw]
          sm:!max-w-[1500px]
          !h-[92vh]
          !p-0
          !flex
          !flex-col
          overflow-hidden
          [&>button]:hidden
        "
      >
        <BulkEditPayments
          rows={rows}
          onCancel={onCancel}
          onUpdateOne={onUpdateOne}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
