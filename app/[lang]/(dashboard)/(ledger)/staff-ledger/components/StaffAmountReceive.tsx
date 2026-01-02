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

/* ================= API BASE ================= */
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
    if (!date || !form.through || !form.amount) {
      toast({
        title: "❌ Required fields missing",
        description: "Date, Through & Amount are mandatory",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        staffLedgerId: staffLedger.id,
        receiptDate: date,
        through: form.through,
        particulars: form.particulars,
        inAmount: Number(form.amount), // ✅ IMPORTANT
      };

      console.log("Amount Receive Payload", payload);

      const res = await fetch(`${BASE_URL}/api/staff-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "✅ Amount Received Saved",
        description: staffLedger.name,
      });

      handleReset();
      onClose();
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "Failed to save received amount",
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
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Through */}
        <div className="space-y-1">
          <Label>Through</Label>
          <select
            className="w-full border rounded-md px-3 py-2 bg-background text-sm"
            value={form.through}
            onChange={(e) =>
              setForm({ ...form, through: e.target.value })
            }
          >
            <option value="">Select Through</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* ===== Particulars ===== */}
      <div className="space-y-1">
        <Label>Particulars</Label>
        <Input
          placeholder="Enter particulars"
          value={form.particulars}
          onChange={(e) =>
            setForm({ ...form, particulars: e.target.value })
          }
        />
      </div>

      {/* ===== Amount In ===== */}
      <div className="space-y-1">
        <Label className="text-green-600">Received / In</Label>
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
