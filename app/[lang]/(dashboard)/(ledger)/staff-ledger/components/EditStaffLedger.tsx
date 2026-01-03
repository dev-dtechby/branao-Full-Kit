"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { StaffExpense } from "./types";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

interface Props {
  row: StaffExpense;
  onClose: () => void;
  onUpdated: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function EditStaffLedger({
  row,
  onClose,
  onUpdated,
}: Props) {
  const { toast } = useToast();

  /* ================= STATE ================= */
  const [date, setDate] = useState<Date>(
    new Date(row.expenseDate)
  );

  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>("");

  const [form, setForm] = useState({
    expenseTitle: row.expenseTitle || "",
    summary: row.summary || "",
    remark: row.remark || "",
    inAmount: row.inAmount?.toString() || "",
    outAmount: row.outAmount?.toString() || "",
  });

  const [loading, setLoading] = useState(false);

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/sites`, {
        credentials: "include",
      });
      const json = await res.json();
      setSites(json?.data ?? []);
    } catch {
      toast({
        title: "❌ Error",
        description: "Failed to load sites",
      });
    }
  };

  /* ================= PREFILL SITE (🔥 KEY FIX) ================= */
  useEffect(() => {
    if (!sites.length || siteId) return;

    if (row.site?.siteName) {
      const matched = sites.find(
        (s) => s.siteName === row.site?.siteName
      );
      if (matched) {
        setSiteId(matched.id);
      }
    }
  }, [sites, row.site, siteId]);

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    try {
      setLoading(true);

      const payload = {
        expenseDate: date.toISOString(),
        siteId: siteId || null,
        expenseTitle: form.expenseTitle,
        summary: form.summary,
        remark: form.remark,
        inAmount: form.inAmount
          ? Number(form.inAmount)
          : null,
        outAmount: form.outAmount
          ? Number(form.outAmount)
          : null,
      };

      const res = await fetch(
        `${BASE_URL}/api/staff-expense/${row.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error();

      toast({
        title: "✅ Updated",
        description: "Ledger entry updated successfully",
      });

      onUpdated();
      onClose();
    } catch {
      toast({
        title: "❌ Error",
        description: "Failed to update entry",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Card className="p-6 rounded-xl bg-card space-y-5">
      <h2 className="text-xl font-semibold">
        Edit Ledger Entry
      </h2>

      {/* ===== Date ===== */}
      <div>
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger className="w-full">
            <div
              className={cn(
                "flex items-center justify-between w-full rounded-md border px-3 py-2 bg-background cursor-pointer"
              )}
            >
              {date.toLocaleDateString()}
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ===== Site (Prefilled + Editable) ===== */}
      <div>
        <Label>Site</Label>
        <select
          className="w-full border rounded-md px-3 py-2 bg-background"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        >
          <option value="">—</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.siteName}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Expense ===== */}
      <div>
        <Label>Expense</Label>
        <Input
          value={form.expenseTitle}
          onChange={(e) =>
            setForm({ ...form, expenseTitle: e.target.value })
          }
        />
      </div>

      {/* ===== Summary ===== */}
      <div>
        <Label>Summary</Label>
        <Input
          value={form.summary}
          onChange={(e) =>
            setForm({ ...form, summary: e.target.value })
          }
        />
      </div>

      {/* ===== Remark ===== */}
      <div>
        <Label>Remark</Label>
        <Input
          value={form.remark}
          onChange={(e) =>
            setForm({ ...form, remark: e.target.value })
          }
        />
      </div>

      {/* ===== Amounts ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-green-600">
            Received (In)
          </Label>
          <Input
            value={form.inAmount}
            onChange={(e) =>
              setForm({ ...form, inAmount: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-red-600">
            Payment (Out)
          </Label>
          <Input
            value={form.outAmount}
            onChange={(e) =>
              setForm({ ...form, outAmount: e.target.value })
            }
          />
        </div>
      </div>

      {/* ===== Buttons ===== */}
      <div className="flex gap-3 pt-4">
        <Button onClick={handleUpdate} disabled={loading}>
          Update
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
