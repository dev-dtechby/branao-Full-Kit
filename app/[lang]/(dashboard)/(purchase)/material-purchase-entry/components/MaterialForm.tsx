"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, X, RefreshCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddMaterial from "./addMaterial";
import { useRouter } from "next/navigation";

/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const SUPPLIER_API = `${BASE_URL}/api/material-suppliers`;
const SITE_API = `${BASE_URL}/api/sites`;
const MATERIAL_API = `${BASE_URL}/api/material-master`;

// ✅ bulk save endpoint
const LEDGER_BULK_API = `${BASE_URL}/api/material-supplier-ledger/bulk`;

/* ================= TYPES ================= */
type Supplier = { id: string; name: string; contactNo?: string | null };
type Site = { id: string; siteName: string };
type Material = { id: string; name: string };

type EntryRow = {
  id: string;

  // ✅ row-wise date
  entryDate: Date | undefined;

  vehicleNo: string;

  materialId: string;
  size: string;
  qty: string;

  // ✅ NEW: rate
  rate: string;

  receiptNo: string;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isPositiveNumber = (v: string) => {
  const x = Number(String(v || "").trim());
  return Number.isFinite(x) && x > 0;
};

export default function MaterialForm({ onCancel }: { onCancel?: () => void }) {
  /* ================= (TOP) SELECTED ================= */
  const [supplierId, setSupplierId] = useState("");
  const [siteId, setSiteId] = useState("");
  const router = useRouter();
  /* ================= DROPDOWN DATA ================= */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [loadingSup, setLoadingSup] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingMat, setLoadingMat] = useState(false);

  const handleCancel = () => {
    if (onCancel) return onCancel();

    // fallback: go back
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    }
  };

  /* ================= ROWS ================= */
  const [rows, setRows] = useState<EntryRow[]>([
    {
      id: uid(),
      entryDate: new Date(), // ✅ default today
      vehicleNo: "",
      materialId: "",
      size: "",
      qty: "",
      rate: "", // ✅ NEW
      receiptNo: "",
    },
  ]);

  const [openAddMaterial, setOpenAddMaterial] = useState(false);

  /* ================= LOADERS ================= */
  const loadSuppliers = async () => {
    try {
      setLoadingSup(true);
      const res = await fetch(`${SUPPLIER_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      setSuppliers(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error(e);
      setSuppliers([]);
    } finally {
      setLoadingSup(false);
    }
  };

  const loadSites = async () => {
    try {
      setLoadingSites(true);
      const res = await fetch(`${SITE_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      setSites(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error(e);
      setSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoadingMat(true);
      const res = await fetch(`${MATERIAL_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      setMaterials(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error(e);
      setMaterials([]);
    } finally {
      setLoadingMat(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
    loadSites();
    loadMaterials();
  }, []);

  const materialNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of materials) m.set(x.id, x.name);
    return m;
  }, [materials]);

  /* ================= ROW HELPERS ================= */
  const updateRow = (id: string, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        entryDate: new Date(), // ✅ default today
        vehicleNo: "",
        materialId: "",
        size: "",
        qty: "",
        rate: "", // ✅ NEW
        receiptNo: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const resetAll = () => {
    setSupplierId("");
    setSiteId("");
    setRows([
      {
        id: uid(),
        entryDate: new Date(),
        vehicleNo: "",
        materialId: "",
        size: "",
        qty: "",
        rate: "", // ✅ NEW
        receiptNo: "",
      },
    ]);
  };

  /* ================= VALIDATION ================= */
  const rowValid = (r: EntryRow) => {
    return (
      !!r.entryDate &&
      r.vehicleNo.trim() &&
      r.materialId &&
      isPositiveNumber(r.qty) &&
      isPositiveNumber(r.rate) && // ✅ NEW
      r.receiptNo.trim()
    );
  };

  const canSave = useMemo(() => {
    if (!supplierId || !siteId) return false;
    if (!rows.length) return false;
    return rows.every(rowValid);
  }, [supplierId, siteId, rows]);

  // ✅ Save to backend (NO FILES) — only rows JSON
  const saveAll = async () => {
    if (!supplierId || !siteId) {
      alert("Please select Supplier and Site.");
      return;
    }
    if (!rows.length) {
      alert("No rows to save.");
      return;
    }
    if (!rows.every(rowValid)) {
      alert("Please complete all rows (Date/Qty/Rate required).");
      return;
    }

    try {
      const fd = new FormData();
      // ✅ backend uses entryDate from form-data for default; but we are sending per row date too
      fd.append("entryDate", new Date().toISOString());
      fd.append("ledgerId", supplierId);
      fd.append("siteId", siteId);

      const payloadRows = rows.map((r) => ({
        rowKey: r.id,
        entryDate: r.entryDate ? r.entryDate.toISOString() : undefined,

        vehicleNo: r.vehicleNo.trim(),
        receiptNo: r.receiptNo.trim(),

        // OTP removed
        otp: null,

        material: materialNameById.get(r.materialId) || r.materialId,
        size: r.size?.trim() || null,
        qty: r.qty,

        // ✅ NEW: Rate (per unit)
        rate: r.rate,
      }));

      fd.append("rows", JSON.stringify(payloadRows));

      const res = await fetch(LEDGER_BULK_API, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Save failed");

      alert(json?.message || "Saved successfully");
      resetAll();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Save failed");
    }
  };

  return (
    <div
      className="h-full w-full"
      style={{
        height: "100%",
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <Card className="border rounded-xl overflow-hidden">
        {/* HEADER */}
        <CardHeader className="pb-3 border-b bg-background/60 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl font-semibold text-default-900">
                Material Purchase Entry
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Top में Supplier / Site चुनो, नीचे table में multiple dates + entries add करो.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenAddMaterial(true)}>
                + Material
              </Button>
              <Button type="button" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" /> Row
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* TOP CONTROLS */}
          <div className="p-4 md:p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Material Supplier</Label>
                <select
                  className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">
                    {loadingSup ? "Loading suppliers..." : "Select Material Supplier"}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Select Site</Label>
                <select
                  className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                >
                  <option value="">
                    {loadingSites ? "Loading sites..." : "Select Site"}
                  </option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="p-3 md:p-4">
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "52vh",
                  scrollbarGutter: "stable",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 1300 }}>
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                        <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-2 py-2 w-10 text-center"> </th>
                          <th className="px-2 py-2 text-left">Date</th>
                          <th className="px-2 py-2 text-left">Vehicle</th>
                          <th className="px-2 py-2 text-left">Material</th>
                          <th className="px-2 py-2 text-left">Size</th>
                          <th className="px-2 py-2 text-left">Qty</th>

                          {/* ✅ NEW */}
                          <th className="px-2 py-2 text-left">Rate</th>

                          <th className="px-2 py-2 text-left">Receipt No</th>
                          <th className="px-2 py-2 text-left w-36">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rows.map((r, idx) => {
                          const ok = rowValid(r);
                          return (
                            <tr
                              key={r.id}
                              className={cn(
                                "border-t transition",
                                ok ? "bg-green-500/5" : "hover:bg-primary/5"
                              )}
                            >
                              <td className="px-2 py-2 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() => removeRow(r.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition"
                                  title="Remove row"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  {idx + 1}
                                </div>
                              </td>

                              {/* ROW DATE PICKER */}
                              <td className="px-2 py-2 align-top">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className={cn(
                                        "h-8 w-40 flex items-center justify-between px-2 rounded-md border bg-background text-sm",
                                        !r.entryDate && "text-muted-foreground"
                                      )}
                                    >
                                      {r.entryDate ? r.entryDate.toLocaleDateString() : "Select Date"}
                                      <CalendarIcon className="h-4 w-4 opacity-60" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0 z-[9999]" align="start" side="bottom" sideOffset={8}>
                                    <Calendar
                                      mode="single"
                                      selected={r.entryDate}
                                      onSelect={(d) => updateRow(r.id, { entryDate: d })}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="CG 04 AB 1234"
                                  value={r.vehicleNo}
                                  onChange={(e) => updateRow(r.id, { vehicleNo: e.target.value })}
                                  className="h-8 w-52 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <select
                                  className="border px-2 py-1.5 rounded-md bg-background w-52 h-8 text-sm"
                                  value={r.materialId}
                                  onChange={(e) => updateRow(r.id, { materialId: e.target.value })}
                                >
                                  <option value="">
                                    {loadingMat ? "Loading..." : "Select Material"}
                                  </option>
                                  {materials.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="40mm"
                                  value={r.size}
                                  onChange={(e) => updateRow(r.id, { size: e.target.value })}
                                  className="h-8 w-28 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Qty"
                                  value={r.qty}
                                  onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                                  className="h-8 w-24 text-sm"
                                  inputMode="decimal"
                                />
                              </td>

                              {/* ✅ NEW: Rate */}
                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Rate"
                                  value={r.rate}
                                  onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                                  className="h-8 w-28 text-sm"
                                  inputMode="decimal"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Receipt no"
                                  value={r.receiptNo}
                                  onChange={(e) => updateRow(r.id, { receiptNo: e.target.value })}
                                  className="h-8 w-36 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                {ok ? (
                                  <div className="text-green-500 text-xs font-medium">Ready</div>
                                ) : (
                                  <div className="text-[11px] text-muted-foreground">Fill required fields</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-muted-foreground">
                              No rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground italic">
              Note: Each row has its own date. Multiple dates can be saved in one go.
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="border-t bg-background/60 backdrop-blur p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Rows: <b>{rows.length}</b> • Ready: <b>{rows.filter(rowValid).length}</b>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={resetAll} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </Button>

                <Button onClick={saveAll} disabled={!canSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>

                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  Cancel
                </Button>

              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ADD MATERIAL MODAL */}
      <Dialog open={openAddMaterial} onOpenChange={setOpenAddMaterial}>
        <DialogContent
          className="
            !p-0 overflow-hidden
            !h-[92vh] !w-[96vw] !max-w-[96vw] md:!max-w-5xl
            !flex !flex-col
          "
        >
          <div className="h-full min-h-0 flex flex-col">
            <div className="shrink-0 px-4 md:px-6 py-4 border-b bg-background/60 backdrop-blur flex items-center justify-between">
              <div className="text-base md:text-lg font-semibold">Material Master</div>
              <Button size="sm" variant="outline" onClick={() => setOpenAddMaterial(false)}>
                Close
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <div
                className="h-full min-h-0 overflow-auto p-3 md:p-4"
                style={{
                  scrollbarGutter: "stable",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                <AddMaterial
                  onChanged={async () => {
                    await loadMaterials();
                  }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
