"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, RefreshCcw, Save, Trash2, Loader2 } from "lucide-react";
import { API, normalizeList } from "./vehicle-rent.api";
import type { Ledger, VehicleRentBasis, VehicleRentVehicle } from "./vehicle-rent.types";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

export default function VehicleRentEntryForm({
  open,
  onClose,
  onCreated,
  mode = "CREATE",
  initial,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;

  // ✅ NEW
  mode?: "CREATE" | "EDIT";
  initial?: Partial<VehicleRentVehicle> | null;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const [ownerLedgerId, setOwnerLedgerId] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [rentBasis, setRentBasis] = useState<VehicleRentBasis>("HOURLY");
  const [hourlyRate, setHourlyRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEdit = mode === "EDIT";

  const canSave = useMemo(() => {
    if (!ownerLedgerId || !vehicleNo.trim() || !vehicleName.trim()) return false;
    if (rentBasis === "HOURLY" && n(hourlyRate) <= 0) return false;
    if (rentBasis === "MONTHLY" && n(monthlyRate) <= 0) return false;
    return true;
  }, [ownerLedgerId, vehicleNo, vehicleName, rentBasis, hourlyRate, monthlyRate]);

  const loadLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const res = await fetch(`${API.ledgers}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      const list = normalizeList(json) as Ledger[];

      // Best-effort filter for vehicle owners (optional)
      const filtered = list.filter((l) => {
        const t = String(l?.ledgerType?.name || "").toLowerCase();
        const nm = String(l?.name || "").toLowerCase();
        return (
          t.includes("vehicle") ||
          t.includes("transport") ||
          nm.includes("vehicle") ||
          nm.includes("transport")
        );
      });

      const finalList = (filtered.length ? filtered : list).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setLedgers(finalList);
    } finally {
      setLoadingLedgers(false);
    }
  };

  const reset = () => {
    setOwnerLedgerId("");
    setVehicleNo("");
    setVehicleName("");
    setRentBasis("HOURLY");
    setHourlyRate("");
    setMonthlyRate("");
    setConfirmDelete(false);
  };

  // ✅ hydrate for edit
  useEffect(() => {
    if (!open) return;

    loadLedgers();

    if (isEdit && initial) {
      setOwnerLedgerId(String(initial.ownerLedgerId || ""));
      setVehicleNo(String(initial.vehicleNo || ""));
      setVehicleName(String(initial.vehicleName || ""));
      setRentBasis((initial.rentBasis as VehicleRentBasis) || "HOURLY");
      setHourlyRate(
        initial.hourlyRate !== null && initial.hourlyRate !== undefined ? String(initial.hourlyRate) : ""
      );
      setMonthlyRate(
        initial.monthlyRate !== null && initial.monthlyRate !== undefined ? String(initial.monthlyRate) : ""
      );
    } else {
      reset();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, initial?.id]);

  // ✅ keep rates consistent when switching basis
  useEffect(() => {
    if (rentBasis === "HOURLY") setMonthlyRate("");
    if (rentBasis === "MONTHLY") setHourlyRate("");
  }, [rentBasis]);

  const save = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      const body: any = {
        ownerLedgerId,
        vehicleNo: vehicleNo.trim(),
        vehicleName: vehicleName.trim(),
        rentBasis,
      };

      if (rentBasis === "HOURLY") body.hourlyRate = n(hourlyRate);
      if (rentBasis === "MONTHLY") body.monthlyRate = n(monthlyRate);

      const url = isEdit ? `${API.vehicles}/${initial?.id}` : API.vehicles;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || (isEdit ? "Update failed" : "Create failed"));

      if (isEdit) {
        onUpdated?.();
      } else {
        onCreated?.();
      }

      reset();
      onClose();
    } catch (e: any) {
      alert(e?.message || (isEdit ? "Update failed" : "Create failed"));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!initial?.id) return;
    try {
      setDeleting(true);

      const res = await fetch(`${API.vehicles}/${initial.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      onDeleted?.();
      setConfirmDelete(false);
      reset();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      {/* ✅ Layout-safe dialog like your other bulk dialogs */}
      <DialogContent className="sm:max-w-[760px] !p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{isEdit ? "Edit Rented Vehicle" : "Create Rented Vehicle"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col min-h-0">
          <div className="p-4 overflow-auto">
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Owner / Party (Ledger)</Label>
                  <select
                    className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                    value={ownerLedgerId}
                    onChange={(e) => setOwnerLedgerId(e.target.value)}
                  >
                    <option value="">
                      {loadingLedgers ? "Loading..." : "Select Owner Ledger"}
                    </option>
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Rent Basis</Label>
                  <select
                    className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                    value={rentBasis}
                    onChange={(e) => setRentBasis(e.target.value as VehicleRentBasis)}
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Vehicle No</Label>
                  <Input
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="CG 04 AB 1234"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Vehicle Name</Label>
                  <Input
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="JCB / Dumper / Truck"
                  />
                </div>

                {rentBasis === "HOURLY" ? (
                  <div className="space-y-1">
                    <Label>Hourly Rate</Label>
                    <Input
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      inputMode="decimal"
                      placeholder="e.g. 900"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label>Monthly Rate</Label>
                    <Input
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(e.target.value)}
                      inputMode="decimal"
                      placeholder="e.g. 45000"
                    />
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Agreement upload vehicle create/update ke baad “Ledger screen” me per-vehicle upload button se hoga.
              </div>

              {/* ✅ Delete confirm box only in EDIT */}
              {isEdit ? (
                <div className="rounded-lg border p-3 bg-background/30">
                  {!confirmDelete ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        Delete will permanently remove this vehicle (hard delete).
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        className="gap-2"
                        disabled={saving || deleting}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Confirm delete?</div>
                      <div className="text-xs text-muted-foreground">
                        This will permanently delete the vehicle master record.
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setConfirmDelete(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="soft"
                          onClick={doDelete}
                          disabled={deleting}
                          className="gap-2"
                        >
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          {deleting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          </div>

          {/* ✅ Sticky footer actions */}
          <div className="p-4 border-t bg-background/60 backdrop-blur flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={loadLedgers}
              className="gap-2"
              disabled={saving || deleting}
            >
              <RefreshCcw className="h-4 w-4" /> Refresh Ledgers
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={saving || deleting}
            >
              Cancel
            </Button>

            <Button
              onClick={save}
              disabled={!canSave || saving || deleting}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
