"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Site } from "./labour-ledger.types";

export default function AddContractDialog({
  open,
  onClose,
  apiBase,
  sites,
  contractorId,
  contractorName,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  sites: Site[];
  contractorId: string;
  contractorName: string;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [agreedAmount, setAgreedAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [agreement, setAgreement] = useState<File | null>(null);

  const save = async () => {
    if (!contractorId) return;
    if (!siteId) return alert("Site required");
    const amt = Number(agreedAmount);
    if (!Number.isFinite(amt) || amt < 0) return alert("Agreed amount invalid");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("contractorId", contractorId);
      fd.append("siteId", siteId);
      fd.append("agreedAmount", String(amt));
      fd.append("remarks", remarks);
      if (agreement) fd.append("agreement", agreement);

      const res = await fetch(`${apiBase}/contracts`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Create deal failed");

      await onSaved?.();
      onClose();

      setSiteId(""); setAgreedAmount(""); setRemarks(""); setAgreement(null);
    } catch (e: any) {
      alert(e?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Site Deal — {contractorName || "Contractor"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <select
            className="border bg-background px-3 py-2 rounded-md text-sm w-full"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">Select Site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.siteName}
              </option>
            ))}
          </select>

          <Input
            placeholder="Agreed Amount (Deal Amount)"
            value={agreedAmount}
            onChange={(e) => setAgreedAmount(e.target.value)}
            inputMode="decimal"
          />

          <Input
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="text-xs text-muted-foreground">
            Agreement file (optional)
          </div>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setAgreement(e.target.files?.[0] || null)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Deal"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
