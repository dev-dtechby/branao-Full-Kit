"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

/* ================= TYPES ================= */
interface StaffLedger {
  id: string;
  name: string;
}

interface Props {
  staffLedger: StaffLedger;
  onClose: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function StaffAmountReceive({
  staffLedger,
  onClose,
}: Props) {
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    through: "",
    particulars: "",
    amount: "",
  });

  /* ================= RESET ================= */
  const handleReset = () => {
    setForm({
      through: "",
      particulars: "",
      amount: "",
    });
    setDate(new Date());
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!date || !form.amount) {
      toast({
        title: "❌ Required",
        description: "Date & Amount are mandatory",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        staffLedgerId: staffLedger.id,
        expenseDate: date.toISOString(),
        expenseTitle: "Amount Received",
        summary: form.particulars,
        remark: form.through, // 🔥 through stored as text
        inAmount: Number(form.amount), // 🔥 IN AMOUNT
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
        title: "✅ Amount Received Saved",
        description: staffLedger.name,
      });

      handleReset();
      onClose();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Failed to save amount",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Card className="p-6 shadow-md border rounded-xl bg-card space-y-6">
      {/* ===== Ledger Name ===== */}
      <h2 className="text-2xl font-semibold text-primary">
        {staffLedger.name}
      </h2>

      {/* ===== Date + Through ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-1">
          <Label>Date</Label>
            <Popover>
              <PopoverTrigger className="w-full">
                <div
                  className={cn(
                    "flex items-center justify-between w-full rounded-md border px-3 py-2 bg-background cursor-pointer text-sm"
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

        {/* Through (TEXT INPUT) */}
        <div className="space-y-1">
          <Label>Through</Label>
          <Input
            placeholder="Cash / UPI / Bank / Any remark"
            value={form.through}
            onChange={(e) =>
              setForm({ ...form, through: e.target.value })
            }
          />
        </div>
      </div>

      {/* ===== Particulars ===== */}
      <div className="space-y-1">
        <Label>Particulars</Label>
        <Input
          placeholder="Received against advance / settlement etc."
          value={form.particulars}
          onChange={(e) =>
            setForm({ ...form, particulars: e.target.value })
          }
        />
      </div>

      {/* ===== Amount In ===== */}
      <div className="space-y-1">
        <Label className="text-green-600">Amount (In)</Label>
        <Input
          className="border-green-500"
          placeholder="Enter received amount"
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
