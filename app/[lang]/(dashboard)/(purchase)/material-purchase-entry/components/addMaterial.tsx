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
interface Material {
  id: string;
  name: string;
}

/* ================= PROPS ================= */
interface Props {
  onChanged?: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const API = `${BASE_URL}/api/material-master`;

export default function AddMaterial({ onChanged }: Props) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [list, setList] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);

  const load = async () => {
    try {
      const res = await fetch(API, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to load materials");
      setList(json?.data ?? []);
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err?.message || "Failed to load materials",
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    const val = name.trim();
    if (!val) return;

    try {
      setLoading(true);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: val }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Add failed");

      toast({ title: "✅ Material Added", description: val });
      setName("");
      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err?.message || "Add failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setName(m.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  const update = async () => {
    if (!editingId) return;

    const val = name.trim();
    if (!val) return;

    try {
      setLoading(true);
      const res = await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: val }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Update failed");

      toast({ title: "✅ Material Updated", description: val });

      cancelEdit();
      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err?.message || "Update failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;

    try {
      setLoading(true);
      const res = await fetch(`${API}/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      toast({
        title: "🗑️ Material Deleted",
        description: "Moved to Deleted Records",
      });

      setOpen(false);
      setSelected(null);

      if (editingId === selected.id) cancelEdit();

      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err?.message || "Delete failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-semibold">Material Master</h2>

        {/* ADD / EDIT */}
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Material Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editingId ? update() : add();
              }
            }}
          />

          {!editingId ? (
            <Button type="button" onClick={add} disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          ) : (
            <>
              <Button type="button" onClick={update} disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* LIST */}
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left">Material</th>
                  <th className="p-2 text-center w-[180px]">Action</th>
                </tr>
              </thead>

              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No materials added yet
                    </td>
                  </tr>
                ) : (
                  list.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2">{m.name}</td>
                      <td className="p-2">
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(m)}
                            disabled={loading}
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(m);
                              setOpen(true);
                            }}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material?</DialogTitle>
            <DialogDescription>
              This material will be removed from the active list and moved to
              <b> Deleted Records</b>.
              <br />
              <br />
              You can restore it later if required.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmDelete} disabled={loading}>
              {loading ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
