"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= TYPES ================= */
interface LedgerType {
  id: string;
  name: string;
}

interface Site {
  id: string;
  siteName: string;
}

interface LedgerDetails {
  id: string;
  name: string;
  address?: string | null;
  mobile?: string | null;
  openingBalance?: number | null;
  closingBalance?: number | null;
  remark?: string | null;
  site?: { id: string; siteName: string } | null;
  ledgerType: { id: string; name: string };
}

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= PROPS ================= */
type Props = {
  ledgerId: string;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditLedgerList({ ledgerId, onClose, onUpdated }: Props) {
  const { toast } = useToast();

  const [ledgerTypes, setLedgerTypes] = useState<LedgerType[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    ledgerTypeId: "",
    siteId: "",
    ledgerName: "",
    address: "",
    mobile: "",
    openingBalance: "",
    closingBalance: "",
    remark: "",
  };

  const [form, setForm] = useState(initialForm);

  /* ================= FETCH MASTER DATA ================= */
  useEffect(() => {
    fetchLedgerTypes();
    fetchSites();
  }, []);

  const fetchLedgerTypes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/ledger-types?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      setLedgerTypes(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setLedgerTypes([]);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/sites?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      setSites(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setSites([]);
    }
  };

  /* ================= FETCH LEDGER DETAILS BY ID ================= */
  useEffect(() => {
    if (!ledgerId) return;
    fetchLedgerById(ledgerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId]);

  const fetchLedgerById = async (id: string) => {
    try {
      setLoading(true);

      // ✅ Assumption: GET /api/ledgers/:id exists
      // If your backend uses another route, just update this URL.
      const res = await fetch(`${BASE_URL}/api/ledgers/${id}?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();
      const data: LedgerDetails | null =
        json?.data && typeof json.data === "object" ? json.data : null;

      if (!res.ok || !data) {
        throw new Error(json?.message || "Failed to fetch ledger details");
      }

      setForm({
        ledgerTypeId: data.ledgerType?.id || "",
        siteId: data.site?.id || "",
        ledgerName: data.name || "",
        address: data.address || "",
        mobile: data.mobile || "",
        openingBalance:
          data.openingBalance === null || data.openingBalance === undefined
            ? ""
            : String(data.openingBalance),
        closingBalance:
          data.closingBalance === null || data.closingBalance === undefined
            ? ""
            : String(data.closingBalance),
        remark: (data as any)?.remark || "",
      });
    } catch (err: any) {
      toast({
        title: "❌ Load Failed",
        description: err?.message || "Could not load ledger",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLERS ================= */
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toNumberOrNull = (val: string) => {
    if (!val?.trim()) return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  const handleUpdate = async () => {
    if (!form.ledgerTypeId || !form.ledgerName) {
      toast({
        title: "❌ Required Fields Missing",
        description: "Ledger Type and Ledger Name are required",
      });
      return;
    }

    try {
      setSaving(true);

      // ✅ Assumption: PUT /api/ledgers/:id exists
      // If your backend uses PATCH, change method accordingly.
      const res = await fetch(`${BASE_URL}/api/ledgers/${ledgerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ledgerTypeId: form.ledgerTypeId,
          siteId: form.siteId || null,
          name: form.ledgerName,
          address: form.address,
          mobile: form.mobile,
          openingBalance: toNumberOrNull(form.openingBalance),
          closingBalance: toNumberOrNull(form.closingBalance),
          remark: form.remark,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Update failed");

      toast({
        title: "✅ Updated",
        description: "Ledger updated successfully",
      });

      onUpdated();
      onClose();
    } catch (err: any) {
      toast({
        title: "❌ Update Failed",
        description: err?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER CARD ================= */}
      <Card className="p-5 space-y-4">
        <h3 className="text-lg font-semibold">Edit Ledger & Site</h3>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ledger Type */}
            <div>
              <Label>Ledger Type</Label>
              <Select
                value={form.ledgerTypeId}
                onValueChange={(value) =>
                  setForm({ ...form, ledgerTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Ledger Type" />
                </SelectTrigger>
                <SelectContent>
                  {ledgerTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Site */}
            <div>
              <Label>Site</Label>
              <Select
                value={form.siteId}
                onValueChange={(value) => setForm({ ...form, siteId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Site</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.siteName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* ================= LEDGER FORM ================= */}
      <Card className="p-6 space-y-6">
        <h3 className="text-xl font-semibold">Ledger Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            name="ledgerName"
            value={form.ledgerName}
            onChange={handleChange}
            placeholder="Ledger Name"
            disabled={loading}
          />
          <Input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            placeholder="Mobile No."
            disabled={loading}
          />
          <Input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            name="openingBalance"
            value={form.openingBalance}
            onChange={handleChange}
            placeholder="Opening Balance"
            disabled={loading}
          />
          <Input
            name="closingBalance"
            value={form.closingBalance}
            onChange={handleChange}
            placeholder="Closing Balance"
            disabled={loading}
          />
          <Input
            name="remark"
            value={form.remark}
            onChange={handleChange}
            placeholder="Remark"
            disabled={loading}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-2 justify-end">
          <Button
            onClick={handleUpdate}
            disabled={saving || loading}
          >
            {saving ? "Updating..." : "Update"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
