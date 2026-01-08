"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import { useToast } from "@/components/ui/use-toast";

import { LEDGER_TYPES_API, LEDGERS_API, PAYMENTS_API } from "./constants";
import { Ledger, LedgerType, PaymentRow, PaymentMode } from "./types";
import { n } from "./utils";

import LedgerSelector from "./LedgerSelector";
import LedgerSummaryBar from "./LedgerSummaryBar";
import AddPaymentForm from "./AddPaymentForm";
import PaymentsTable from "./PaymentsTable";
import EditPaymentDialog from "./EditPaymentDialog";
import BulkEditPaymentsDialog from "./BulkEditPaymentsDialog";

/* ================= MAIN COMPONENT ================= */
export default function PaymentsEntry({ trans }: { trans: any }) {
  const { toast } = useToast();

  /* ===== Master ===== */
  const [ledgerTypes, setLedgerTypes] = useState<LedgerType[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  /* ===== Selected ===== */
  const [ledgerTypeId, setLedgerTypeId] = useState("");
  const [ledgerQuery, setLedgerQuery] = useState("");
  const [selectedLedgerId, setSelectedLedgerId] = useState("");

  const selectedLedger = useMemo(
    () => ledgers.find((l) => l.id === selectedLedgerId) || null,
    [ledgers, selectedLedgerId]
  );

  /* ===== Loading ===== */
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  /* ===== Payment Form ===== */
  const [payDate, setPayDate] = useState<Date | undefined>(new Date());
  const [payMode, setPayMode] = useState<PaymentMode>("CASH");
  const [particular, setParticular] = useState("");
  const [amount, setAmount] = useState("");

  /* ===== Payments Table ===== */
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  /* ===== Selection / Bulk ===== */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  );

  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  /* ===== Dialogs ===== */
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow, setEditRow] = useState<PaymentRow | null>(null);

  const [openBulkEdit, setOpenBulkEdit] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  /* ================= LOAD LEDGER TYPES ================= */
  const loadLedgerTypes = async () => {
    try {
      setLoadingTypes(true);
      const res = await fetch(`${LEDGER_TYPES_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      setLedgerTypes(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error(e);
      setLedgerTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  };

  /* ================= LOAD LEDGERS BY TYPE ================= */
const loadLedgers = async (typeId: string) => {
  if (!typeId) {
    setLedgers([]);
    setSelectedLedgerId("");
    setLedgerQuery("");
    return;
  }

  try {
    setLoadingLedgers(true);

    // ✅ If ALL -> fetch all ledgers
    const url =
      typeId === "ALL"
        ? `${LEDGERS_API}?_ts=${Date.now()}`
        : `${LEDGERS_API}?ledgerTypeId=${encodeURIComponent(typeId)}&_ts=${Date.now()}`;

    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include",
    });

    const data = res.ok ? await res.json() : null;
    const list = Array.isArray(data) ? data : data?.data || [];
    setLedgers(list);

    // reset selection when type changes
    setSelectedLedgerId("");
    setLedgerQuery("");
    setRows([]);
    setSelectedIds(new Set());
  } catch (e) {
    console.error(e);
    setLedgers([]);
  } finally {
    setLoadingLedgers(false);
  }
};


  /* ================= LOAD PAYMENTS ================= */
  const loadPayments = async (ledgerId: string) => {
    if (!ledgerId) {
      setRows([]);
      return;
    }
    try {
      setLoadingRows(true);

      const params = new URLSearchParams();
      params.set("ledgerId", ledgerId);

      const res = await fetch(`${PAYMENTS_API}?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = res.ok ? await res.json() : null;
      setRows(Array.isArray(data) ? data : data?.data || []);
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    loadLedgerTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLedgers(ledgerTypeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerTypeId]);

  useEffect(() => {
    loadPayments(selectedLedgerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLedgerId]);

  /* keep selection clean when rows change */
  useEffect(() => {
    setSelectedIds((prev) => {
      const all = new Set(rows.map((r) => r.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (all.has(id)) next.add(id);
      });
      return next;
    });
  }, [rows]);

  /* ================= LEDGER SUGGESTIONS ================= */
  const ledgerSuggestions = useMemo(() => {
    const q = ledgerQuery.trim().toLowerCase();
    if (!q) return ledgers.slice(0, 30);
    return ledgers.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 30);
  }, [ledgerQuery, ledgers]);

  const applyLedgerByName = (name: string) => {
    const found = ledgers.find(
      (l) => l.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (found) {
      setSelectedLedgerId(found.id);
      setLedgerQuery(found.name);
      return true;
    }
    return false;
  };

  /* ================= TOTALS ================= */
  const totalPaid = useMemo(() => rows.reduce((a, r) => a + n(r.amount), 0), [rows]);

  /* ================= CREATE PAYMENT ================= */
  const canSave =
    !!selectedLedgerId && !!payDate && n(amount) > 0 && !!payMode;

  const resetForm = () => {
    setPayDate(new Date());
    setPayMode("CASH");
    setParticular("");
    setAmount("");
  };

  const createPayment = async () => {
    if (!selectedLedgerId) {
      toast({
        title: "Select Ledger",
        description: "Please select Ledger Type and Ledger name.",
        variant: "destructive",
      });
      return;
    }
    if (!payDate || n(amount) <= 0) {
      toast({
        title: "Invalid data",
        description: "Date and Amount are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        ledgerId: selectedLedgerId,
        paymentDate: payDate.toISOString(),
        paymentMode: payMode,
        particular: particular?.trim() || "",
        amount: n(amount),
      };

      const res = await fetch(PAYMENTS_API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Payment save failed");

      toast({ title: "Saved", description: "Payment entry added." });
      resetForm();
      await loadPayments(selectedLedgerId);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "Payment save failed",
        variant: "destructive",
      });
    }
  };

  /* ================= UPDATE PAYMENT ================= */
  const updatePayment = async (id: string, patch: Partial<PaymentRow>) => {
    const res = await fetch(`${PAYMENTS_API}/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Update failed");
  };

  const openEditRow = (r: PaymentRow) => {
    setEditRow(r);
    setOpenEdit(true);
  };

  const saveEditRow = async () => {
    if (!editRow) return;

    if (!editRow.paymentDate || n(editRow.amount) <= 0) {
      toast({
        title: "Invalid",
        description: "Date and Amount required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePayment(editRow.id, {
        paymentDate: editRow.paymentDate,
        paymentMode: editRow.paymentMode,
        particular: editRow.particular ?? "",
        amount: n(editRow.amount),
      });
      toast({ title: "Updated", description: "Payment updated." });
      setOpenEdit(false);
      setEditRow(null);
      await loadPayments(selectedLedgerId);
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Update failed",
        variant: "destructive",
      });
    }
  };

  /* ================= DELETE (SINGLE) ================= */
  const askDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`${PAYMENTS_API}/${deleteTargetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      toast({ title: "Deleted", description: "Payment removed." });
      setDeleteOpen(false);
      setDeleteTargetId(null);
      await loadPayments(selectedLedgerId);
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "Delete failed",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };
const exportPaymentsToExcel = () => {
  // Simple CSV (Excel open kar leta hai)
  if (!rows.length) return;

  const fileBase = (selectedLedger?.name || "payments")
    .replace(/[^\w]+/g, "_")
    .slice(0, 40);

  const header = ["Date", "Mode", "Particular", "Amount"];
  const csvRows = [
    header.join(","),
    ...rows.map((r) => {
      const d = new Date(r.paymentDate);
      const dateStr = isNaN(d.getTime()) ? r.paymentDate : d.toLocaleDateString();
      const mode = r.paymentMode;
      const part = (r.particular || "-").replace(/"/g, '""');
      const amt = String(r.amount ?? 0);
      return [`"${dateStr}"`, `"${mode}"`, `"${part}"`, `"${amt}"`].join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileBase}_payments.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const exportPaymentsToPDF = () => {
  if (!rows.length) return;

  const title = `Payment Report - ${selectedLedger?.name || ""}`;
  const html = `
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>${title}</title>
        <style>
          body{font-family: Arial, sans-serif; padding:16px;}
          h2{margin:0 0 10px;}
          table{width:100%; border-collapse:collapse; font-size:12px;}
          th,td{border:1px solid #999; padding:6px; text-align:left;}
          th{background:#eee;}
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Mode</th>
              <th>Particular</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((r) => {
                const d = new Date(r.paymentDate);
                const dateStr = isNaN(d.getTime()) ? r.paymentDate : d.toLocaleDateString();
                return `
                  <tr>
                    <td>${dateStr}</td>
                    <td>${r.paymentMode}</td>
                    <td>${r.particular || "-"}</td>
                    <td>${Number(r.amount || 0).toFixed(2)}</td>
                  </tr>`;
              })
              .join("")}
          </tbody>
        </table>
        <script>
          window.onload = function(){ window.print(); }
        </script>
      </body>
    </html>
  `;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
};

  /* ================= BULK DELETE ================= */
  const confirmBulkDelete = async () => {
    if (!selectedIds.size) return;

    try {
      setBulkDeleteLoading(true);
      await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          const res = await fetch(`${PAYMENTS_API}/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) throw new Error("Bulk delete failed on some rows");
        })
      );

      toast({ title: "Deleted", description: "Bulk delete completed." });
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      await loadPayments(selectedLedgerId);
    } catch (e: any) {
      toast({
        title: "Bulk delete failed",
        description: e?.message || "Bulk delete failed",
        variant: "destructive",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 shadow-sm border rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <CardTitle className="text-xl md:text-2xl font-semibold text-default-900">
            Payment Entry
          </CardTitle>

            <LedgerSelector
              ledgerTypes={ledgerTypes}
              loadingTypes={loadingTypes}
              ledgerTypeId={ledgerTypeId}
              onLedgerTypeChange={(id) => setLedgerTypeId(id)}
              loadingLedgers={loadingLedgers}
              ledgerQuery={ledgerQuery}
              onLedgerQueryChange={(val) => {
                setLedgerQuery(val);
                if (!val) setSelectedLedgerId("");
              }}
              ledgerSuggestions={ledgerSuggestions}
              selectedLedgerId={selectedLedgerId}
              onBlurApplyLedgerByName={(name) => applyLedgerByName(name)}
              exportDisabled={!selectedLedgerId || rows.length === 0}
              onExportExcel={exportPaymentsToExcel}
              onExportPDF={exportPaymentsToPDF}
            />

        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <LedgerSummaryBar
          selectedLedger={selectedLedger}
          totalPaid={totalPaid}
          selectedCount={selectedIds.size}
          onOpenBulkEdit={() => setOpenBulkEdit(true)}
          onOpenBulkDelete={() => setBulkDeleteOpen(true)}
        />

        <AddPaymentForm
          disabled={!selectedLedgerId}
          payDate={payDate}
          setPayDate={setPayDate}
          payMode={payMode}
          setPayMode={setPayMode}
          particular={particular}
          setParticular={setParticular}
          amount={amount}
          setAmount={setAmount}
          canSave={canSave}
          onReset={resetForm}
          onSave={createPayment}
        />

        <PaymentsTable
          rows={rows}
          loadingRows={loadingRows}
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          onToggleRow={toggleRow}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          onEdit={openEditRow}
          onDelete={askDelete}
        />

        {/* Edit Dialog */}
        <EditPaymentDialog
          open={openEdit}
          onOpenChange={setOpenEdit}
          editRow={editRow}
          setEditRow={setEditRow}
          onSave={saveEditRow}
        />

        {/* Bulk Edit Dialog */}
        <BulkEditPaymentsDialog
          open={openBulkEdit}
          onOpenChange={setOpenBulkEdit}
          rows={selectedRows}
          onCancel={() => setOpenBulkEdit(false)}
          onUpdateOne={updatePayment}
          onSaved={async () => {
            setOpenBulkEdit(false);
            setSelectedIds(new Set());
            await loadPayments(selectedLedgerId);
          }}
        />

        {/* Single Delete Confirm */}
        <DeleteConfirmDialog
          open={deleteOpen}
          title="Delete Payment?"
          description="This payment entry will be deleted. This action cannot be undone."
          loading={deleteLoading}
          onCancel={() => {
            setDeleteOpen(false);
            setDeleteTargetId(null);
          }}
          onConfirm={confirmDelete}
        />

        {/* Bulk Delete Confirm */}
        <DeleteConfirmDialog
          open={bulkDeleteOpen}
          title={`Delete ${selectedIds.size} Payment Rows?`}
          description="Selected payment entries will be deleted. This action cannot be undone."
          loading={bulkDeleteLoading}
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={confirmBulkDelete}
        />
      </CardContent>
    </Card>
  );
}
