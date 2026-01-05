"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */
interface LedgerType {
  id: string;
  name: string;
}

/* ================= PROPS ================= */
interface Props {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const API = `${BASE_URL}/api/ledger-types`;

export default function AddLedgerType({ open, onClose, onChanged }: Props) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [list, setList] = useState<LedgerType[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Edit states (DepartmentMaster pattern)
  const [editingId, setEditingId] = useState<string | null>(null);

  // delete dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LedgerType | null>(null);

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();
      setList(Array.isArray(json?.data) ? json.data : []);
    } catch {
      toast({
        title: "❌ Error",
        description: "Failed to load ledger types",
      });
    }
  };

  useEffect(() => {
    if (open) {
      load();
      // reset UI each time dialog opens
      setName("");
      setEditingId(null);
      setSelected(null);
      setDeleteOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ================= START EDIT ================= */
  const startEdit = (lt: LedgerType) => {
    setEditingId(lt.id);
    setName(lt.name);
  };

  /* ================= CANCEL EDIT ================= */
  const cancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  /* ================= ADD ================= */
  const add = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      toast({
        title: "✅ Ledger Type Added",
        description: name,
      });

      setName("");
      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Add failed",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE (needs backend PUT route) ================= */
  const update = async () => {
    if (!editingId) return;
    if (!name.trim()) return;

    try {
      setLoading(true);

      // ✅ Requires backend: PUT /api/ledger-types/:id
      const res = await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      toast({
        title: "✅ Ledger Type Updated",
        description: name,
      });

      cancelEdit();
      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Update failed",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= SOFT DELETE ================= */
  const confirmDelete = async () => {
    if (!selected) return;

    try {
      const res = await fetch(`${API}/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      toast({
        title: "🗑️ Ledger Type Deleted",
        description: "Moved to Deleted Records",
      });

      setDeleteOpen(false);
      setSelected(null);

      if (editingId === selected.id) cancelEdit();

      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Delete failed",
      });
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          // if user clicks outside to close
          if (!v) onClose();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ledger Type Master</DialogTitle>
            <DialogDescription>
              Add, edit, or remove ledger types used across ERP.
            </DialogDescription>
          </DialogHeader>

          <Card className="p-5 space-y-4">
            {/* ADD / EDIT */}
            <div className="flex gap-3">
              <Input
                placeholder="Ledger Type Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {!editingId ? (
                <Button onClick={add} disabled={loading}>
                  {loading ? "Adding..." : "Add"}
                </Button>
              ) : (
                <>
                  <Button onClick={update} disabled={loading}>
                    {loading ? "Updating..." : "Update"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* LIST (✅ Scrollbar Added like DepartmentMaster) */}
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left">Ledger Type</th>
                      <th className="p-2 text-center w-[180px]">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-4 text-center text-muted-foreground"
                        >
                          No ledger types added yet
                        </td>
                      </tr>
                    )}

                    {list.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="p-2">{l.name}</td>

                        <td className="p-2">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(l)}
                              disabled={loading}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelected(l);
                                setDeleteOpen(true);
                              }}
                              disabled={loading}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                cancelEdit();
                onClose();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM ===== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ledger Type?</DialogTitle>
            <DialogDescription>
              This ledger type will be removed from active list and moved to
              <b> Deleted Records</b>.
              <br />
              <br />
              You can restore it later if required.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="soft" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
