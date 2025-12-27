"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ---------------- PROPS ----------------
interface StaffExpEntryFormProps {
  staff: string;
  onClose: () => void;
}

export default function StaffExpEntryForm({ staff, onClose }: StaffExpEntryFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-6 shadow-md border space-y-6 mt-4 rounded-xl bg-card">
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-default-900">
          Expense Entry – <span className="text-primary">{staff}</span>
        </h2>

        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* ---------- ROW 1 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Date */}
        <div className="space-y-1">
          <Label className="font-semibold">Date</Label>

          <Popover>
            <PopoverTrigger className="w-full">
              <div
                className={cn(
                  "flex items-center justify-between w-full rounded-md border px-3 py-2 text-sm bg-background cursor-pointer"
                )}
              >
                {date ? date.toLocaleDateString() : "Pick a date"}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </div>
            </PopoverTrigger>

            <PopoverContent className="p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Site */}
        <div>
          <Label className="font-semibold">Site</Label>
          <select className="w-full border rounded-md px-3 py-2 bg-background text-sm">
            <option>Select Site</option>
            <option>Dev Site</option>
            <option>New Raipur</option>
            <option>Kondagaon</option>
          </select>
        </div>

        {/* Expense Summary */}
        <div>
          <Label className="font-semibold">Exp. Summary</Label>
          <select className="w-full border rounded-md px-3 py-2 bg-background text-sm">
            <option>Select Summary</option>
            <option>Petrol</option>
            <option>Food</option>
            <option>Office Work</option>
          </select>
        </div>
      </div>

      {/* ---------- ROW 2 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Through */}
        <div>
          <Label className="font-semibold">Through</Label>
          <select className="w-full border rounded-md px-3 py-2 bg-background text-sm">
            <option>Select Through</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
          </select>
        </div>

        {/* Particulars */}
        <div>
          <Label className="font-semibold">Particulars</Label>
          <Input placeholder="Enter particulars" />
        </div>
      </div>

      {/* ---------- ROW 3 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Out Amount */}
        <div>
          <Label className="font-semibold text-green-600">Amount (Out)</Label>
          <Input className="border-green-500" placeholder="Enter Out Amount" />
        </div>

        {/* Received Amount */}
        <div>
          <Label className="font-semibold text-red-600">Received / In</Label>
          <Input className="border-red-500" placeholder="Enter Received Amount" />
        </div>
      </div>

      {/* ---------- Buttons ---------- */}
      <div className="flex flex-wrap gap-3 pt-3">
        <Button className="px-8">Save</Button>
        <Button variant="soft" className="px-8">Update</Button>
        <Button variant="outline" className="px-8">Reset</Button>
      </div>
    </Card>
  );
}
