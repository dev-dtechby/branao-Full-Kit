"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import {
  Plus,
  RefreshCcw,
  Pencil,
  Trash2,
  Upload,
  Filter,
  Search,
  FileText,
  Download,
  ChevronDown,
  PencilLine,
} from "lucide-react";

import VehicleRentEntryForm from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentEntryForm";
import VehicleRentLogDialog from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentLogDialog";
import VehicleRentAgreementDialog from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentAgreementDialog";
import { API, normalizeList } from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/vehicle-rent.api";

import type {
  Ledger,
  Site,
  VehicleRentLog,
  VehicleRentVehicle,
} from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/vehicle-rent.types";

import {
  exportVehicleRentExcel,
  exportVehicleRentPDF,
  type VehicleRentExportRow,
} from "./VehicleExportUtil";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

const lower = (v: any) => String(v ?? "").toLowerCase();

const getVehicleBillingLabel = (v: any) => {
  const t = lower(v?.billingType ?? v?.rentType ?? v?.type ?? v?.rateType ?? v?.rentBasis);
  const monthly = n(v?.monthlyAmt ?? v?.monthlyAmount ?? v?.monthlyRate ?? v?.monthlyRent);
  const hourly = n(v?.hourlyAmt ?? v?.hourlyAmount ?? v?.hourlyRate ?? v?.hourlyRent);

  if (t.includes("month")) return "Monthly";
  if (t.includes("hour")) return "Hourly";

  if (monthly > 0 && hourly <= 0) return "Monthly";
  if (hourly > 0 && monthly <= 0) return "Hourly";
  return t ? t : "—";
};

const getVehicleRateText = (v: any) => {
  const monthly = n(v?.monthlyAmt ?? v?.monthlyAmount ?? v?.monthlyRate ?? v?.monthlyRent);
  const hourly = n(v?.hourlyAmt ?? v?.hourlyAmount ?? v?.hourlyRate ?? v?.hourlyRent);

  const label = getVehicleBillingLabel(v);

  if (label === "Monthly" && monthly > 0) {
    const perDay = monthly / 30;
    return `₹ ${monthly.toFixed(2)}/month (₹ ${perDay.toFixed(2)}/day)`;
  }
  if (label === "Hourly" && hourly > 0) {
    return `₹ ${hourly.toFixed(2)}/hr`;
  }

  if (monthly > 0 && hourly > 0) return `Monthly ₹ ${monthly.toFixed(2)} | Hourly ₹ ${hourly.toFixed(2)}`;
  if (monthly > 0) return `₹ ${monthly.toFixed(2)}/month`;
  if (hourly > 0) return `₹ ${hourly.toFixed(2)}/hr`;
  return "—";
};

// ✅ FIX: Owner name should still show in All Owners even if logs don't include ownerLedger relation.
const getOwnerName = (log: any, ledgersById: Map<string, any>, vehiclesById: Map<string, any>) => {
  const ownerId =
    String(log?.ownerLedgerId || "") ||
    String(log?.vehicle?.ownerLedgerId || "") ||
    String(vehiclesById.get(String(log?.vehicleId || ""))?.ownerLedgerId || "");

  if (ownerId) {
    const l = ledgersById.get(String(ownerId));
    if (l?.name) return String(l.name);
  }

  const maybe =
    log?.ownerLedger?.name ||
    log?.vehicle?.ownerLedger?.name ||
    log?.ledger?.name ||
    log?.ownerName;

  return maybe ? String(maybe) : "-";
};

export default function VehicleRentLedgerTable({ baseUrl }: { baseUrl: string }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRentVehicle[]>([]);
  const [logs, setLogs] = useState<VehicleRentLog[]>([]);

  const [loading, setLoading] = useState(false);

  // Filters
  const [ownerLedgerId, setOwnerLedgerId] = useState("");
  const [siteId, setSiteId] = useState("ALL");
  const [vehicleId, setVehicleId] = useState("");

  const [q, setQ] = useState("");

  // Dialogs
  const [openCreateVehicle, setOpenCreateVehicle] = useState(false);

  // ✅ Vehicle master edit
  const [openEditVehicle, setOpenEditVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRentVehicle | null>(null);

  // ✅ Vehicle master delete
  const [confirmVehicleDelete, setConfirmVehicleDelete] = useState(false);
  const [vehicleDeleteId, setVehicleDeleteId] = useState("");
  const [vehicleDeleteLoading, setVehicleDeleteLoading] = useState(false);

  const [openLog, setOpenLog] = useState(false);
  const [logMode, setLogMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingLog, setEditingLog] = useState<VehicleRentLog | null>(null);

  const [openAgreement, setOpenAgreement] = useState(false);
  const [agreementVehicleId, setAgreementVehicleId] = useState("");

  // Log delete dialog
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const exportWrapRef = useRef<HTMLDivElement | null>(null);

  // ✅ Import dialog
  const [openImport, setOpenImport] = useState(false);

  const showOwnerCol = !ownerLedgerId; // All Owners => show Owner column

  const loadSites = async () => {
    const res = await fetch(`${API.sites}?_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    const list = (normalizeList(json) as Site[]).filter((s) => !s.isDeleted);
    list.sort((a, b) => (a.siteName || "").localeCompare(b.siteName || ""));
    setSites(list);
  };

  const loadLedgers = async () => {
    const res = await fetch(`${API.ledgers}?_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    const list = normalizeList(json) as Ledger[];
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setLedgers(list);
  };

  const loadVehicles = async (ownerId?: string) => {
    const params = new URLSearchParams();
    if (ownerId) params.set("ownerLedgerId", ownerId);

    const res = await fetch(`${API.vehicles}?${params.toString()}&_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));
    const list = normalizeList(json) as VehicleRentVehicle[];
    setVehicles(list);
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ownerLedgerId) params.set("ownerLedgerId", ownerLedgerId);

      if (siteId && siteId !== "ALL") params.set("siteId", siteId);
      if (vehicleId) params.set("vehicleId", vehicleId);

      const res = await fetch(`${API.logs}?${params.toString()}&_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      setLogs(normalizeList(json) as VehicleRentLog[]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadSites(), loadLedgers(), loadVehicles(ownerLedgerId || undefined)]);
    await loadLogs();
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVehicles(ownerLedgerId || undefined);
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerLedgerId, siteId, vehicleId]);

  // ✅ close export dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = exportWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as any)) setExportOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const ledgersById = useMemo(() => {
    const m = new Map<string, any>();
    for (const l of ledgers) m.set(String((l as any).id), l);
    return m;
  }, [ledgers]);

  const vehiclesById = useMemo(() => {
    const m = new Map<string, any>();
    for (const v of vehicles) m.set(String((v as any).id), v);
    return m;
  }, [vehicles]);

  const filteredLogs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter((r: any) => {
      const siteName = String(r.site?.siteName || "").toLowerCase();
      const vno = String(r.vehicle?.vehicleNo || "").toLowerCase();
      const vnm = String(r.vehicle?.vehicleName || "").toLowerCase();
      const rem = String(r.remarks || "").toLowerCase();
      const ownerNm = String(getOwnerName(r, ledgersById, vehiclesById) || "").toLowerCase();
      return siteName.includes(s) || vno.includes(s) || vnm.includes(s) || rem.includes(s) || ownerNm.includes(s);
    });
  }, [logs, q, ledgersById, vehiclesById]);

  // ✅ Balance = Generated - DieselExp - Payment
  const totals = useMemo(() => {
    return filteredLogs.reduce(
      (a, r: any) => {
        const generated = n(r.generatedAmt);
        const paid = n(r.paymentAmt);
        const diesel = n(r.dieselExp);
        const balance = generated - diesel - paid;

        a.generated += generated;
        a.paid += paid;
        a.diesel += diesel;
        a.balance += balance;
        return a;
      },
      { generated: 0, paid: 0, diesel: 0, balance: 0 }
    );
  }, [filteredLogs]);

  const selectedOwnerLedger = useMemo(() => {
    if (!ownerLedgerId) return null;
    return ledgers.find((l: any) => String(l.id) === String(ownerLedgerId)) || null;
  }, [ownerLedgerId, ledgers]);

  const selectedSite = useMemo(() => {
    if (!siteId || siteId === "ALL") return null;
    return sites.find((s: any) => String(s.id) === String(siteId)) || null;
  }, [siteId, sites]);

  const selectedVehicle = useMemo(() => {
    if (!vehicleId) return null;
    return vehicles.find((v: any) => String(v.id) === String(vehicleId)) || null;
  }, [vehicleId, vehicles]);

  // ✅ Export prep rows (same table)
  const exportRows: VehicleRentExportRow[] = useMemo(() => {
    return filteredLogs.map((r: any) => {
      const v: any = r.vehicle || vehiclesById.get(String(r.vehicleId)) || {};
      const owner = getOwnerName(r, ledgersById, vehiclesById);

      const generated = n(r.generatedAmt);
      const paid = n(r.paymentAmt);
      const diesel = n(r.dieselExp);
      const balance = generated - diesel - paid;

      return {
        date: r.entryDate ? new Date(r.entryDate).toLocaleDateString() : "",
        owner,
        site: r.site?.siteName || "-",
        vehicleNo: v?.vehicleNo || "-",
        vehicleName: v?.vehicleName || "",
        vehicleType: getVehicleBillingLabel(v),
        vehicleRate: getVehicleRateText(v),
        start: n(r.startMeter),
        end: n(r.endMeter),
        workingHr: n(r.workingHour),
        dieselExp: diesel,
        generated,
        payment: paid,
        balance,
        remark: String(r.remarks || ""),
      };
    });
  }, [filteredLogs, vehiclesById, ledgersById]);

  const exportMeta = useMemo(() => {
    const ownerName = selectedOwnerLedger?.name ? String((selectedOwnerLedger as any).name) : "All Owners";
    const ownerContact =
      String((selectedOwnerLedger as any)?.mobile || (selectedOwnerLedger as any)?.phone || (selectedOwnerLedger as any)?.contact || "") || "";
    const ownerAddress =
      String((selectedOwnerLedger as any)?.address || "") || "";

    const vehicleLabel = selectedVehicle
      ? `${(selectedVehicle as any)?.vehicleNo || "-"} — ${(selectedVehicle as any)?.vehicleName || ""}`
      : "All Vehicles";

    const vehicleTypeLabel = selectedVehicle ? getVehicleBillingLabel(selectedVehicle) : "Multiple";
    const vehicleRateText = selectedVehicle ? getVehicleRateText(selectedVehicle) : "-";

    const siteLabel = selectedSite?.siteName ? String(selectedSite.siteName) : "All Sites";

    return {
      title: "Vehicle Rent Ledger",
      ownerLedgerName: ownerName,
      ownerContact,
      ownerAddress,
      vehicleLabel,
      vehicleTypeLabel,
      vehicleRateText,
      siteLabel,
      generatedOn: new Date().toLocaleString(),
    };
  }, [selectedOwnerLedger, selectedVehicle, selectedSite]);

  const openCreateLog = () => {
    setLogMode("CREATE");
    setEditingLog(null);
    setOpenLog(true);
  };

  const openEditLog = (row: VehicleRentLog) => {
    setLogMode("EDIT");
    setEditingLog(row);
    setOpenLog(true);
  };

  const askDelete = (id: string) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`${API.logs}/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      setConfirmDelete(false);
      setDeleteId("");
      await loadLogs();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ Vehicle master edit open
  const openVehicleEdit = (v: VehicleRentVehicle) => {
    setEditingVehicle(v);
    setOpenEditVehicle(true);
  };

  // ✅ Vehicle master delete confirm
  const askVehicleDelete = (id: string) => {
    setVehicleDeleteId(id);
    setConfirmVehicleDelete(true);
  };

  // ✅ Vehicle master delete
  const doVehicleDelete = async () => {
    if (!vehicleDeleteId) return;
    try {
      setVehicleDeleteLoading(true);
      const res = await fetch(`${API.vehicles}/${vehicleDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Vehicle delete failed");

      setConfirmVehicleDelete(false);
      setVehicleDeleteId("");

      await loadVehicles(ownerLedgerId || undefined);
      await loadLogs();
    } catch (e: any) {
      alert(e?.message || "Vehicle delete failed");
    } finally {
      setVehicleDeleteLoading(false);
    }
  };

  const doExportExcel = async () => {
    try {
      setExportOpen(false);
      await exportVehicleRentExcel(exportMeta, exportRows);
    } catch (e: any) {
      alert(e?.message || "Excel export failed. Ensure 'xlsx' is installed.");
    }
  };

  const doExportPDF = async () => {
    try {
      setExportOpen(false);
      await exportVehicleRentPDF(exportMeta, exportRows);
    } catch (e: any) {
      alert(e?.message || "PDF export failed. Ensure 'jspdf' & 'jspdf-autotable' are installed.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border rounded-xl overflow-hidden">
        <CardHeader className="border-b bg-background/60 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl font-semibold">Vehicle Rent Ledger</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Owner ledger → Multiple vehicles → Multiple sites (site-wise filter + all site view)
              </div>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap justify-end items-center">
              <Button variant="outline" onClick={refreshAll} className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Refresh
              </Button>

              <Button onClick={() => setOpenCreateVehicle(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>

              <Button onClick={openCreateLog} className="gap-2">
                <Plus className="h-4 w-4" /> Add Log
              </Button>

              {/* Export dropdown */}
              <div className="relative" ref={exportWrapRef}>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setExportOpen((s) => !s)}
                  disabled={!exportRows.length}
                  title={!exportRows.length ? "No rows to export" : "Export"}
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>

                {exportOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-lg overflow-hidden z-50">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                      onClick={doExportPDF}
                    >
                      Export PDF
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                      onClick={doExportExcel}
                    >
                      Export Excel
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Import button */}
              <Button variant="outline" className="gap-2" onClick={() => setOpenImport(true)}>
                <Upload className="h-4 w-4" /> Import
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> Owner Ledger
              </div>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={ownerLedgerId}
                onChange={(e) => setOwnerLedgerId(e.target.value)}
              >
                <option value="">All Owners</option>
                {ledgers.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Site</div>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <option value="ALL">All Sites</option>
                {sites.map((s) => (
                  <option key={(s as any).id} value={(s as any).id}>
                    {(s as any).siteName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Vehicle</div>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNo} — {v.vehicleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="site / vehicle / remark"
                className="h-9"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Generated Amt</div>
              <div className="text-base md:text-lg font-bold">₹ {totals.generated.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Payment</div>
              <div className="text-base md:text-lg font-bold">₹ {totals.paid.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Diesel Exp</div>
              <div className="text-base md:text-lg font-bold">₹ {totals.diesel.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Balance</div>
              <div className={cn("text-base md:text-lg font-bold", totals.balance >= 0 ? "text-red-500" : "text-green-600")}>
                ₹ {totals.balance.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                (Generated - Diesel Exp - Payment)
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card/40 overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: "62vh" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: showOwnerCol ? 1500 : 1300 }}>
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                      <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2 text-left">Date</th>
                        {showOwnerCol ? <th className="px-2 py-2 text-left">Owner</th> : null}
                        <th className="px-2 py-2 text-left">Site</th>
                        <th className="px-2 py-2 text-left">Vehicle</th>
                        <th className="px-2 py-2 text-right">Start</th>
                        <th className="px-2 py-2 text-right">End</th>
                        <th className="px-2 py-2 text-right">Working Hr</th>
                        <th className="px-2 py-2 text-right">Diesel Exp</th>
                        <th className="px-2 py-2 text-right">Generated</th>
                        <th className="px-2 py-2 text-right">Payment</th>
                        <th className="px-2 py-2 text-right">Balance</th>
                        <th className="px-2 py-2 text-left">Remark</th>
                        <th className="px-2 py-2 text-left w-32">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLogs.map((r: any) => {
                        const v: any = r.vehicle || vehiclesById.get(String(r.vehicleId)) || {};
                        const ownerName = getOwnerName(r, ledgersById, vehiclesById);

                        const generated = n(r.generatedAmt);
                        const paid = n(r.paymentAmt);
                        const diesel = n(r.dieselExp);
                        const balance = generated - diesel - paid;

                        return (
                          <tr key={r.id} className="border-t hover:bg-primary/5">
                            <td className="px-2 py-2">{new Date(r.entryDate).toLocaleDateString()}</td>

                            {showOwnerCol ? (
                              <td className="px-2 py-2">
                                <div className="font-medium">{ownerName}</div>
                              </td>
                            ) : null}

                            <td className="px-2 py-2">{r.site?.siteName || "-"}</td>

                            <td className="px-2 py-2">
                              <div className="font-medium">{v?.vehicleNo || "-"}</div>
                              <div className="text-xs text-muted-foreground">{v?.vehicleName || ""}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {getVehicleBillingLabel(v)} • {getVehicleRateText(v)}
                              </div>
                            </td>

                            <td className="px-2 py-2 text-right">{n(r.startMeter).toFixed(2)}</td>
                            <td className="px-2 py-2 text-right">{n(r.endMeter).toFixed(2)}</td>
                            <td className="px-2 py-2 text-right">{n(r.workingHour).toFixed(2)}</td>
                            <td className="px-2 py-2 text-right">₹ {diesel.toFixed(2)}</td>
                            <td className="px-2 py-2 text-right font-medium">₹ {generated.toFixed(2)}</td>
                            <td className="px-2 py-2 text-right">₹ {paid.toFixed(2)}</td>

                            <td className={cn("px-2 py-2 text-right font-medium", balance > 0 ? "text-red-500" : "text-green-600")}>
                              ₹ {balance.toFixed(2)}
                            </td>

                            <td className="px-2 py-2">{r.remarks || ""}</td>

                            <td className="px-2 py-2">
                              <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => openEditLog(r)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => askDelete(r.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {!filteredLogs.length ? (
                        <tr>
                          <td colSpan={showOwnerCol ? 13 : 12} className="p-6 text-center text-muted-foreground">
                            {loading ? "Loading..." : "No data"}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Per-vehicle agreement quick actions */}
          <div className="rounded-xl border p-3 bg-background/30">
            <div className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Vehicle Agreements
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {vehicles.slice(0, 8).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-background">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {v.vehicleNo} — {v.vehicleName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getVehicleBillingLabel(v)} • {getVehicleRateText(v)} • {v.agreementUrl ? "Agreement uploaded" : "No agreement"}
                    </div>
                  </div>

                  {/* ✅ Added: Edit + Delete + Upload (existing upload kept) */}
                  <div className="flex gap-2 shrink-0">
                    {v.agreementUrl ? (
                      <a className="text-xs underline" href={v.agreementUrl as any} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : null}

                    <Button size="icon" variant="outline" onClick={() => openVehicleEdit(v)} title="Edit vehicle">
                      <PencilLine className="h-4 w-4" />
                    </Button>

                    <Button size="icon" variant="outline" onClick={() => askVehicleDelete(v.id)} title="Delete vehicle">
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setAgreementVehicleId(v.id);
                        setOpenAgreement(true);
                      }}
                      title="Upload agreement"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {vehicles.length > 8 ? (
                <div className="text-xs text-muted-foreground p-2">
                  More vehicles available… filter owner to see specific list.
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Vehicle Dialog */}
      <VehicleRentEntryForm
        open={openCreateVehicle}
        onClose={() => setOpenCreateVehicle(false)}
        onCreated={async () => {
          await loadVehicles(ownerLedgerId || undefined);
        }}
      />

      {/* ✅ Vehicle Edit Dialog */}
      <VehicleRentEntryForm
        open={openEditVehicle}
        onClose={() => setOpenEditVehicle(false)}
        mode="EDIT"
        initial={editingVehicle || undefined}
        onUpdated={async () => {
          await loadVehicles(ownerLedgerId || undefined);
          await loadLogs();
        }}
      />

      {/* Log Dialog */}
      <VehicleRentLogDialog
        open={openLog}
        onClose={() => setOpenLog(false)}
        mode={logMode}
        sites={sites}
        vehicles={vehicles}
        initial={editingLog || undefined}
        onSaved={async () => {
          await loadLogs();
        }}
      />

      {/* Agreement Upload */}
      <VehicleRentAgreementDialog
        open={openAgreement}
        onClose={() => setOpenAgreement(false)}
        vehicleId={agreementVehicleId}
        onUploaded={async () => {
          await loadVehicles(ownerLedgerId || undefined);
        }}
      />

      {/* Log Delete Confirm */}
      <DeleteConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        title="Delete Entry?"
        description="This will permanently delete the logbook entry."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={doDelete}
        loading={deleteLoading}
      />

      {/* ✅ Vehicle Delete Confirm */}
      <DeleteConfirmDialog
        open={confirmVehicleDelete}
        onCancel={() => setConfirmVehicleDelete(false)}
        title="Delete Vehicle?"
        description="This will permanently delete the vehicle master record."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={doVehicleDelete}
        loading={vehicleDeleteLoading}
      />

      {/* ✅ Import Dialog (existing as-is) */}
      <VehicleRentImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        apiBase={API.logs}
        sites={sites}
        vehicles={vehicles}
        onDone={async () => {
          await loadLogs();
        }}
      />
    </div>
  );
}

/* ===========================
   IMPORT DIALOG (Excel)
=========================== */

function toYMD(d: Date) {
  const pad2 = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseExcelDate(v: unknown) {
  if (!v) return "";
  if (v instanceof Date) return toYMD(v);

  const num = Number(v);
  if (Number.isFinite(num) && num > 20000) {
    const js = new Date(Math.round((num - 25569) * 86400 * 1000));
    return toYMD(js);
  }

  const s = String(v).trim();
  if (!s) return "";

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return toYMD(d);

  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const dd = String(Number(m[1])).padStart(2, "0");
    const mm = String(Number(m[2])).padStart(2, "0");
    const yy = String(m[3]).length === 2 ? `20${m[3]}` : m[3];
    return `${yy}-${mm}-${dd}`;
  }
  return "";
}

function VehicleRentImportDialog({
  open,
  onClose,
  apiBase,
  sites,
  vehicles,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  sites: any[];
  vehicles: any[];
  onDone?: () => Promise<void> | void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const siteIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sites) m.set(String(s.siteName || "").toLowerCase(), String(s.id));
    return m;
  }, [sites]);

  const vehicleIdByNo = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of vehicles) m.set(String(v.vehicleNo || "").toLowerCase(), String(v.id));
    return m;
  }, [vehicles]);

  const parse = async () => {
    if (!file) return;
    try {
      setParsing(true);
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const mapped = json.map((r: any) => {
        const entryDate = parseExcelDate(r.entryDate ?? r.EntryDate ?? r.date ?? r.Date);

        const siteIdRaw = String(r.siteId ?? r.SiteId ?? "").trim();
        const siteNameRaw = String(r.siteName ?? r.SiteName ?? "").trim();

        const vehicleIdRaw = String(r.vehicleId ?? r.VehicleId ?? "").trim();
        const vehicleNoRaw = String(r.vehicleNo ?? r.VehicleNo ?? "").trim();

        let siteId = siteIdRaw;
        if (!siteId && siteNameRaw) {
          siteId = siteIdByName.get(siteNameRaw.toLowerCase()) || "";
        }

        let vehicleId = vehicleIdRaw;
        if (!vehicleId && vehicleNoRaw) {
          vehicleId = vehicleIdByNo.get(vehicleNoRaw.toLowerCase()) || "";
        }

        const startMeter = n(r.startMeter ?? r.StartMeter ?? 0);
        const endMeter = n(r.endMeter ?? r.EndMeter ?? 0);

        const dieselExp = n(r.dieselExp ?? r.DieselExp ?? 0);
        const generatedAmt = n(r.generatedAmt ?? r.GeneratedAmt ?? 0);
        const paymentAmt = n(r.paymentAmt ?? r.PaymentAmt ?? 0);

        const remarks = String(r.remarks ?? r.Remarks ?? "").trim() || null;

        const workingHour = Math.max(0, endMeter - startMeter);

        return {
          entryDate,
          siteId,
          vehicleId,
          startMeter,
          endMeter,
          workingHour,
          dieselExp,
          generatedAmt,
          paymentAmt,
          remarks,
        };
      });

      const cleaned = mapped.filter((x: any) => x.entryDate && x.siteId && x.vehicleId);
      setRows(cleaned);
    } catch (e: any) {
      alert(e?.message || "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const validRow = (r: any) => !!r.entryDate && !!r.siteId && !!r.vehicleId;

  const doImport = async () => {
    if (!rows.length) return alert("No valid rows to import");
    if (!rows.every(validRow)) return alert("Some rows are invalid (missing Date/Site/Vehicle)");

    try {
      setImporting(true);

      for (const r of rows) {
        const res = await fetch(`${apiBase}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: r.vehicleId,
            siteId: r.siteId,
            entryDate: new Date(r.entryDate).toISOString(),
            startMeter: n(r.startMeter),
            endMeter: n(r.endMeter),
            workingHour: n(r.workingHour),
            dieselExp: n(r.dieselExp),
            generatedAmt: n(r.generatedAmt),
            paymentAmt: n(r.paymentAmt),
            remarks: r.remarks,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Import failed");
      }

      await onDone?.();
      onClose();
      setFile(null);
      setRows([]);
    } catch (e: any) {
      alert(e?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={cn(!open && "hidden")}>
      <div
        className={cn("fixed inset-0 z-50 bg-black/60", open ? "block" : "hidden")}
        onClick={() => (importing ? null : onClose())}
      />
      <div
        className={cn(
          "fixed z-50 left-1/2 top-1/2 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background shadow-xl overflow-hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="p-4 border-b">
          <div className="text-base font-semibold">Import Vehicle Rent Logs (Excel)</div>
          <div className="text-xs text-muted-foreground mt-1">
            Columns allowed: EntryDate/Date, SiteId/SiteName, VehicleId/VehicleNo, StartMeter, EndMeter, DieselExp, GeneratedAmt, PaymentAmt, Remarks
          </div>
        </div>

        <div className="p-4 grid gap-3">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e: any) => setFile(e.target.files?.[0] || null)}
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={parse} disabled={!file || parsing}>
              {parsing ? "Parsing..." : "Parse File"}
            </Button>
            <Button onClick={doImport} disabled={!rows.length || importing}>
              {importing ? "Importing..." : `Import ${rows.length} Rows`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Close
            </Button>
          </div>

          <div className="border rounded-md overflow-auto" style={{ maxHeight: 320 }}>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/60 border-b sticky top-0">
                <tr className="text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">SiteId</th>
                  <th className="px-3 py-2 text-left">VehicleId</th>
                  <th className="px-3 py-2 text-right">Generated</th>
                  <th className="px-3 py-2 text-right">Diesel</th>
                  <th className="px-3 py-2 text-right">Payment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{r.entryDate}</td>
                    <td className="px-3 py-2">{r.siteId}</td>
                    <td className="px-3 py-2">{r.vehicleId}</td>
                    <td className="px-3 py-2 text-right">{n(r.generatedAmt).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{n(r.dieselExp).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{n(r.paymentAmt).toFixed(2)}</td>
                  </tr>
                ))}

                {!rows.length ? (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                      No parsed rows yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground">
            Tip: SiteName aur VehicleNo se mapping ho jayega agar IDs available nahi hain.
          </div>
        </div>
      </div>
    </div>
  );
}
