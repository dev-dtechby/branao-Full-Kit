"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddContractorDialog({
  open,
  onClose,
  apiBase,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  const save = async () => {
    if (!name.trim()) return alert("Name required");
    try {
      setSaving(true);
      const res = await fetch(`${apiBase}/contractors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, mobile, address }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Create failed");
      await onSaved?.();
      onClose();
      setName(""); setMobile(""); setAddress("");
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
          <DialogTitle>Add Labour Contractor</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
