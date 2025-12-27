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

// -------------------- Props --------------------
interface StaffAmountReceiveProps {
  staff: string;
  onClose: () => void;
}

export default function StaffAmountReceive({
  staff,
  onClose,
}: StaffAmountReceiveProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-6 mt-4 shadow-md border space-y-6 rounded-xl bg-card">
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-default-900">
          Amount Received –{" "}
          <span className="text-primary font-bold">{staff}</span>
        </h2>

        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* ---------- ROW 1 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-1">
          <Label className="font-semibold">Date</Label>

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
          <Label className="font-semibold">Through</Label>
          <select className="w-full border rounded-md px-3 py-2 bg-background text-sm">
            <option>Select Through</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* ---------- Particulars ---------- */}
      <div className="space-y-1">
        <Label className="font-semibold">Particulars</Label>
        <Input placeholder="Enter particulars" />
      </div>

      {/* ---------- Received Amount ---------- */}
      <div className="space-y-1">
        <Label className="font-semibold text-red-600">Received / In</Label>
        <Input
          className="border-red-500"
          placeholder="Enter received amount"
        />
      </div>

      {/* ---------- Buttons ---------- */}
      <div className="flex flex-wrap gap-3 pt-3">
        <Button className="px-8">Save</Button>
        <Button variant="soft" className="px-8">
          Update
        </Button>
        <Button variant="outline" className="px-8">
          Reset
        </Button>
      </div>
    </Card>
  );
}
