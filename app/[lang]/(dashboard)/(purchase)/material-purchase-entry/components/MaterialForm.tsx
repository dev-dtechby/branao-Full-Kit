"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Upload,
  Camera,
  Plus,
  X,
  CheckCircle2,
  RefreshCcw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddMaterial from "./addMaterial";

/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const SUPPLIER_API = `${BASE_URL}/api/material-suppliers`;
const SITE_API = `${BASE_URL}/api/sites`;
const MATERIAL_API = `${BASE_URL}/api/material-master`;

/* ================= TYPES ================= */
type Supplier = { id: string; name: string; contactNo?: string | null };
type Site = { id: string; siteName: string };
type Material = { id: string; name: string };

type EntryRow = {
  id: string;

  vehicleNo: string;
  unloadingFile?: File | null;

  materialId: string;
  size: string;
  qty: string;

  receiptNo: string;
  receiptFile?: File | null;

  otp: string;
  receiptOtpMatch: boolean;
  scanning: boolean;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const genOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const isPositiveNumber = (v: string) => {
  const x = Number(String(v || "").trim());
  return Number.isFinite(x) && x > 0;
};

export default function MaterialForm({
  onCancel,
}: {
  onCancel?: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  /* ================= DROPDOWN DATA ================= */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [loadingSup, setLoadingSup] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingMat, setLoadingMat] = useState(false);

  /* ================= SELECTED ================= */
  const [supplierId, setSupplierId] = useState("");
  const [siteId, setSiteId] = useState("");

  /* ================= ROWS ================= */
  const [rows, setRows] = useState<EntryRow[]>([
    {
      id: uid(),
      vehicleNo: "",
      unloadingFile: null,
      materialId: "",
      size: "",
      qty: "",
      receiptNo: "",
      receiptFile: null,
      otp: "",
      receiptOtpMatch: false,
      scanning: false,
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

  /* ================= ROW HELPERS ================= */
  const updateRow = (id: string, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        vehicleNo: "",
        unloadingFile: null,
        materialId: "",
        size: "",
        qty: "",
        receiptNo: "",
        receiptFile: null,
        otp: "",
        receiptOtpMatch: false,
        scanning: false,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const resetAll = () => {
    setDate(new Date());
    setSupplierId("");
    setSiteId("");
    setRows([
      {
        id: uid(),
        vehicleNo: "",
        unloadingFile: null,
        materialId: "",
        size: "",
        qty: "",
        receiptNo: "",
        receiptFile: null,
        otp: "",
        receiptOtpMatch: false,
        scanning: false,
      },
    ]);
  };

  /* ================= UPLOAD / OTP (PER ROW) ================= */
  const onUnloadingPhoto = (id: string, file?: File) => {
    if (!file) return;
    const otp = genOtp();
    updateRow(id, {
      unloadingFile: file,
      otp,
      receiptOtpMatch: false,
      receiptFile: null,
      scanning: false,
    });
  };

  const scanReceiptForOtp = (id: string, file?: File) => {
    if (!file) return;
    updateRow(id, { receiptFile: file, scanning: true });

    setTimeout(() => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (!r.otp) return { ...r, scanning: false, receiptOtpMatch: false };
          const ok = Math.random() > 0.4; // dummy OCR
          return { ...r, scanning: false, receiptOtpMatch: ok };
        })
      );
    }, 800);
  };

  /* ================= VALIDATION ================= */
  const rowValid = (r: EntryRow) => {
    return (
      r.vehicleNo.trim() &&
      !!r.unloadingFile &&
      r.materialId &&
      isPositiveNumber(r.qty) &&
      r.receiptNo.trim() &&
      !!r.receiptFile &&
      !!r.otp &&
      r.receiptOtpMatch
    );
  };

  const canSave = useMemo(() => {
    if (!date || !supplierId || !siteId) return false;
    if (!rows.length) return false;
    return rows.every(rowValid);
  }, [date, supplierId, siteId, rows]);

  const saveAll = async () => {
    // connect backend later
    console.log("SAVE", { date, supplierId, siteId, rows });
    alert("Demo: Save triggered (connect backend next).");
  };

  /* ================= LAYOUT NOTE =================
     ✅ MOBILE: entire page scrolls
     ✅ TABLE AREA: separately scrolls inside (when you reach it)
     ✅ rows height reduced (excel-like)
  ================================================= */

  return (
    <div
      className="h-full w-full"
      style={{
        height: "100%",
        overflow: "auto", // ✅ whole page scroll (mobile-friendly)
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <Card className="border rounded-xl overflow-hidden">
        {/* ================= HEADER ================= */}
        <CardHeader className="pb-3 border-b bg-background/60 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl font-semibold text-default-900">
                Material Purchase Entry
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Top में Date / Supplier / Site चुनो, नीचे table में multiple entries add करो.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenAddMaterial(true)}
              >
                + Material
              </Button>
              <Button type="button" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" /> Row
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ================= TOP CONTROLS ================= */}
          <div className="p-4 md:p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DATE */}
              <div className="space-y-1">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "h-9 w-full flex items-center justify-between px-3 rounded-md border bg-background text-sm"
                      )}
                    >
                      {date ? date.toLocaleDateString() : "Select Date"}
                      <CalendarIcon className="h-4 w-4 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* SUPPLIER */}
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

              {/* SITE */}
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

          {/* ================= TABLE AREA (SEPARATE SCROLL) ================= */}
          <div className="p-3 md:p-4">
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              {/* ✅ fixed-height scroll area for table (desktop+mobile both) */}
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "52vh", // ✅ table area scrolls
                  scrollbarGutter: "stable",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                {/* Horizontal scroll wrapper */}
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 1200 }}>
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                        <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-2 py-2 w-10 text-center"> </th>
                          <th className="px-2 py-2 text-left">Vehicle</th>
                          <th className="px-2 py-2 text-left">Unloading</th>
                          <th className="px-2 py-2 text-left">Material</th>
                          <th className="px-2 py-2 text-left">Size</th>
                          <th className="px-2 py-2 text-left">Qty</th>
                          <th className="px-2 py-2 text-left">Receipt No</th>
                          <th className="px-2 py-2 text-left">Receipt</th>
                          <th className="px-2 py-2 text-left">OTP</th>
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

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="CG 04 AB 1234"
                                  value={r.vehicleNo}
                                  onChange={(e) =>
                                    updateRow(r.id, { vehicleNo: e.target.value })
                                  }
                                  className="h-8 w-52 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <input
                                  id={`unload-${r.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    onUnloadingPhoto(r.id, e.target.files?.[0])
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 w-48 gap-2 justify-start"
                                  onClick={() =>
                                    document.getElementById(`unload-${r.id}`)?.click()
                                  }
                                >
                                  <Camera className="h-4 w-4" />
                                  {r.unloadingFile ? "Uploaded" : "Upload"}
                                </Button>
                                <div className="text-[10px] mt-1">
                                  {r.otp ? (
                                    <span className="text-green-500">
                                      OTP: <b>{r.otp}</b>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Upload → OTP
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <select
                                  className="border px-2 py-1.5 rounded-md bg-background w-52 h-8 text-sm"
                                  value={r.materialId}
                                  onChange={(e) =>
                                    updateRow(r.id, { materialId: e.target.value })
                                  }
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

                              <td className="px-2 py-2 align-top">
                                <Input
                                  placeholder="Receipt no"
                                  value={r.receiptNo}
                                  onChange={(e) =>
                                    updateRow(r.id, { receiptNo: e.target.value })
                                  }
                                  className="h-8 w-36 text-sm"
                                />
                              </td>

                              <td className="px-2 py-2 align-top">
                                <input
                                  id={`receipt-${r.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    scanReceiptForOtp(r.id, e.target.files?.[0])
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 w-44 gap-2 justify-start"
                                  disabled={!r.otp}
                                  onClick={() =>
                                    document.getElementById(`receipt-${r.id}`)?.click()
                                  }
                                >
                                  <Upload className="h-4 w-4" />
                                  {r.scanning
                                    ? "Scanning..."
                                    : r.receiptFile
                                    ? "Uploaded"
                                    : "Upload"}
                                </Button>
                                <div className="text-[10px] mt-1">
                                  {r.scanning ? (
                                    <span className="text-muted-foreground">Scanning…</span>
                                  ) : r.receiptFile ? (
                                    r.receiptOtpMatch ? (
                                      <span className="text-green-500">OTP Verified ✔</span>
                                    ) : (
                                      <span className="text-red-500">OTP Not Found ❌</span>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">OTP first</span>
                                  )}
                                </div>
                              </td>

                              <td className="px-2 py-2 align-top">
                                <Input disabled value={r.otp} className="h-8 w-20 text-sm" />
                              </td>

                              <td className="px-2 py-2 align-top">
                                {ok ? (
                                  <div className="inline-flex items-center gap-2 text-green-500 text-xs">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Ready
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-muted-foreground">
                                    Fill + verify OTP
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={10} className="p-6 text-center text-muted-foreground">
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

            <div className="mt-3 text-xs text-yellow-600 italic">
              Receipt must contain the same OTP generated from unloading photo.
            </div>
          </div>

          {/* ================= FOOTER ACTIONS (SAVE / RESET / CANCEL) ================= */}
          <div className="border-t bg-background/60 backdrop-blur p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Rows: <b>{rows.length}</b> • Ready: <b>{rows.filter(rowValid).length}</b>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  onClick={saveAll}
                  disabled={!canSave}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onCancel?.()}
                  className="gap-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= ADD MATERIAL MODAL ================= */}
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
