"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  exportLedgerListToExcel,
  exportLedgerListToPDF,
} from "./exportLedgerListUtils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditLedgerList from "./EditLedgerList";

/* ================= TYPES ================= */
interface Ledger {
  id: string;
  name: string;
  openingBalance?: number | null;
  closingBalance?: number | null;
  site?: { id: string; siteName: string } | null;
  ledgerType: { id: string; name: string };
}

interface Site {
  id: string;
  siteName: string;
}

interface LedgerType {
  id: string;
  name: string;
}

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= COMPONENT ================= */
export default function LedgerListTable() {
  const [search, setSearch] = useState("");
  const [siteId, setSiteId] = useState("");
  const [ledgerTypeId, setLedgerTypeId] = useState("");

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [ledgerTypes, setLedgerTypes] = useState<LedgerType[]>([]);

  // ✅ NEW: Edit Dialog state (does not disturb existing features)
  const [openEdit, setOpenEdit] = useState(false);
  const [editLedgerId, setEditLedgerId] = useState<string>("");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchLedgers();
    fetchSites();
    fetchLedgerTypes();
  }, []);

  const fetchLedgers = async () => {
    const res = await fetch(`${BASE_URL}/api/ledgers?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    setLedgers(Array.isArray(json?.data) ? json.data : []);
  };

  const fetchSites = async () => {
    const res = await fetch(`${BASE_URL}/api/sites?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    setSites(Array.isArray(json?.data) ? json.data : []);
  };

  const fetchLedgerTypes = async () => {
    const res = await fetch(`${BASE_URL}/api/ledger-types?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    setLedgerTypes(Array.isArray(json?.data) ? json.data : []);
  };

  /* ================= FILTER + SEARCH ================= */
  const filteredData = useMemo(() => {
    return ledgers.filter((l) => {
      const text = search.toLowerCase();

      // ✅ small safe fix (site optional) - does not change feature, only prevents crash
      const matchesSearch =
        !search ||
        (l.name || "").toLowerCase().includes(text) ||
        (l.ledgerType?.name || "").toLowerCase().includes(text) ||
        ((l.site?.siteName || "").toLowerCase().includes(text));

      const matchesSite = !siteId || l.site?.id === siteId;

      const matchesLedgerType =
        !ledgerTypeId || l.ledgerType.id === ledgerTypeId;

      return matchesSearch && matchesSite && matchesLedgerType;
    });
  }, [search, siteId, ledgerTypeId, ledgers]);

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-6 border rounded-md mt-4 space-y-4">
        <h2 className="text-xl font-semibold">Ledger List</h2>

        {/* 🔍 SEARCH + FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search by Site / Ledger Type / Party"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* SITE FILTER */}
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select Site</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.siteName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* LEDGER TYPE FILTER */}
          <Select value={ledgerTypeId} onValueChange={setLedgerTypeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Ledger Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select Ledger Type</SelectItem>
              {ledgerTypes.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* EXPORT */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportLedgerListToExcel(filteredData, "Ledger_List")}
            >
              Export Excel
            </Button>

            <Button
              variant="outline"
              onClick={() => exportLedgerListToPDF(filteredData, "Ledger_List")}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-default-100">
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Ledger Type</th>
                <th className="px-4 py-3 text-left">Party Name</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No records found
                  </td>
                </tr>
              )}

              {filteredData.map((row) => (
                <tr key={row.id} className="border-t hover:bg-default-50">
                  <td className="px-4 py-3">{row.site?.siteName || "-"}</td>
                  <td className="px-4 py-3">{row.ledgerType.name}</td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ₹ {row.closingBalance ?? row.openingBalance ?? 0}
                  </td>

                  <td className="px-4 py-3 flex justify-center gap-3">
                    {/* <Eye className="w-5 h-5 text-primary cursor-pointer" /> */}

                    {/* ✅ EDIT: open dialog and pass ledgerId */}
                    <Pencil
                      className="w-5 h-5 text-yellow-500 cursor-pointer"
                      onClick={() => {
                        setEditLedgerId(row.id);
                        setOpenEdit(true);
                      }}
                    />

                    <Trash2 className="w-5 h-5 text-red-500 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ✅ EDIT DIALOG (new) */}
      <Dialog
        open={openEdit}
        onOpenChange={(v) => {
          setOpenEdit(v);
          if (!v) setEditLedgerId("");
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Ledger</DialogTitle>
          </DialogHeader>

          {editLedgerId ? (
            <EditLedgerList
              ledgerId={editLedgerId}
              onClose={() => {
                setOpenEdit(false);
                setEditLedgerId("");
              }}
              onUpdated={async () => {
                // refresh list after update (filters/search remain as-is)
                await fetchLedgers();
              }}
            />
          ) : (
            <div className="text-sm text-muted-foreground">No ledger selected</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
