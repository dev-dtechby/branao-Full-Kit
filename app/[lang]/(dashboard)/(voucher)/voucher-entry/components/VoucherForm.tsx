"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoucherForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const fields = [
    "Gross Amt",
    "Withheld",
    "Income Tax",
    "Revenue",
    "LWF",
    "Royalty",
    "Misc. Deduction",
    "Karmkar Tax",
    "Secured Deposit",
    "TDS on GST",
    "TDS",
    "Performance Guarantee",
    "GST",
    "Improper Finishing",
    "Other Deduction",
    "Deduction Amt",
    "Cheque Amt",
  ];

  return (
    <Card className="p-6 shadow-sm border rounded-xl bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-default-900">
          Voucher Entry Form
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">

        {/* ===================== TOP ROW ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Voucher Date */}
          <div className="space-y-1">
            <Label>Voucher Date</Label>

            <Popover>
              <PopoverTrigger className="w-full">
                <div
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 border rounded-md bg-background cursor-pointer"
                  )}
                >
                  {date ? date.toLocaleDateString() : "Pick a date"}
                  <CalendarIcon className="h-4 w-4 opacity-60" />
                </div>
              </PopoverTrigger>

              <PopoverContent className="p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Site */}
          <div className="space-y-1">
            <Label>Site</Label>
            <Input placeholder="Enter Site" />
          </div>

          {/* Department */}
          <div className="space-y-1">
            <Label>Department</Label>
            <Input placeholder="Enter Department" />
          </div>
        </div>

        {/* ===================== MAIN FIELDS GRID ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* LEFT COLUMN LABELS + INPUTS */}
          <div className="grid grid-cols-2 gap-4 items-start">
            {fields.map((label) => (
              <div key={label} className="col-span-2 md:col-span-2 grid grid-cols-2 gap-3 items-center">
                <Label className="font-medium">{label}</Label>
                <Input placeholder={`Enter ${label}`} />
              </div>
            ))}
          </div>

          {/* RIGHT SIDE – UPLOAD VOUCHER */}
          <div className="space-y-6">
            <div className="space-y-1">
              <Label>Upload Voucher</Label>
              <Button variant="outline" className="w-full flex gap-2 justify-center">
                <Upload className="h-4 w-4" /> Upload File
              </Button>
            </div>

            {/* <div className="space-y-1">
              <Label>Upload Icon</Label>
              <Button variant="outline" className="w-full flex gap-2 justify-center">
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </div> */}
          </div>
        </div>

        {/* ===================== ACTION BUTTONS ===================== */}
        <div className="flex flex-wrap gap-4 pt-6">
          <Button className="px-10">Save</Button>
          <Button variant="soft" className="px-10">
            Update
          </Button>
          <Button variant="outline" className="px-10">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
