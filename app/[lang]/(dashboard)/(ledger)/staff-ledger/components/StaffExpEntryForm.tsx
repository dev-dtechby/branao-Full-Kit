"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

interface Props {
  staffLedger: {
    id: string;
    name: string;
  };
  onClose: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function StaffExpEntryForm({
  staffLedger,
  onClose,
}: Props) {
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    siteId: "",
    expenseTitle: "",
    summary: "",
    remark: "",
    amount: "", // 🔥 UI stays SAME
  });

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

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.siteId || !form.expenseTitle || !form.amount) {
      toast({
        title: "⚠️ Required",
        description: "Site, Expense & Amount are mandatory",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        staffLedgerId: staffLedger.id, // ✅ FIX
        siteId: form.siteId,
        expenseDate: date?.toISOString(), // ✅ SAFE
        expenseTitle: form.expenseTitle,
        summary: form.summary,
        remark: form.remark,
        outAmount: Number(form.amount), // ✅ FIX (backend expects outAmount)
      };

      const res = await fetch(`${BASE_URL}/api/staff-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      toast({
        title: "✅ Expense Saved",
        description: "Staff & Site expense recorded",
      });

      handleReset();
      onClose();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Failed to save expense",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET ================= */
  const handleReset = () => {
    setForm({
      siteId: "",
      expenseTitle: "",
      summary: "",
      remark: "",
      amount: "",
    });
    setDate(new Date());
  };

  /* ================= UI ================= */
  return (
    <Card className="p-6 rounded-xl bg-card shadow-md space-y-6">
      {/* ===== Ledger Name ===== */}
      <h2 className="text-2xl font-semibold text-primary">
        {staffLedger.name}
      </h2>

      {/* ===== Date + Site ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <Label>Date</Label>
            <Popover>
              <PopoverTrigger className="w-full">
                <div
                  className={cn(
                    "flex items-center justify-between w-full rounded-md border px-3 py-2 bg-background cursor-pointer"
                  )}
                >
                  {date ? date.toLocaleDateString() : "Pick a date"}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </div>
              </PopoverTrigger>

              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="z-[9999] p-0 bg-background border shadow-lg"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

        </div>

        {/* Site */}
        <div>
          <Label>Site</Label>
          <select
            className="w-full border rounded-md px-3 py-2 bg-background"
            value={form.siteId}
            onChange={(e) =>
              setForm({ ...form, siteId: e.target.value })
            }
          >
            <option value="">Select Site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.siteName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== Expense / Particular ===== */}
      <div>
        <Label>Expense / Particular</Label>
        <Input
          placeholder="Petrol / Labour / Food etc."
          value={form.expenseTitle}
          onChange={(e) =>
            setForm({ ...form, expenseTitle: e.target.value })
          }
        />
      </div>

      {/* ===== Summary ===== */}
      <div>
        <Label>Exp. Summary</Label>
        <Input
          placeholder="Short summary"
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
          placeholder="Additional remark"
          value={form.remark}
          onChange={(e) =>
            setForm({ ...form, remark: e.target.value })
          }
        />
      </div>

      {/* ===== Amount ===== */}
      <div>
        <Label className="text-red-600">
          Amount (Out)
        </Label>
        <Input
          className="border-red-500"
          placeholder="Enter Out Amount"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />
      </div>

      {/* ===== Buttons ===== */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
