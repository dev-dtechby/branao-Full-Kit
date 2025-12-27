"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

/* ============================
   REQUIRED PROPS INTERFACE
=============================== */
interface FuelPurchaseFormProps {
  station: string;          // selectedStation
  onClose: () => void;      // function to close popup
}

export default function FuelPurchaseForm({
  station,
  onClose,
}: FuelPurchaseFormProps) {

  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-default-900">
          Fuel Purchase Entry — {station}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* ===================== DATE ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-1">
            <Label>Date</Label>

            <Popover>
              <PopoverTrigger className="w-full">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md border bg-background cursor-pointer"
                  )}
                >
                  {date ? date.toLocaleDateString() : "Select Date"}
                  <CalendarIcon className="h-4 w-4 opacity-60" />
                </div>
              </PopoverTrigger>

              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ===================== PARTY & SITE ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-1">
            <Label>Select Party</Label>
            <select className="border px-3 py-2 rounded-md bg-background w-full">
              <option>Select Party</option>
              <option>Bharat Petroleum</option>
              <option>Indian Oil</option>
              <option>HP Fuel Station</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Select Site</Label>
            <select className="border px-3 py-2 rounded-md bg-background w-full">
              <option>Select Site</option>
              <option>Dev Site</option>
              <option>Kondagaon Site</option>
              <option>Rasani Site</option>
            </select>
          </div>
        </div>

        {/* ===================== VEHICLE SECTION ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-1">
            <Label>Select Vehicle</Label>
            <select className="border px-3 py-2 rounded-md bg-background w-full">
              <option>Select Vehicle</option>
              <option>CG04-5521</option>
              <option>CG03-4412</option>
              <option>CG22-9988</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Purchase Type</Label>
            <select className="border px-3 py-2 rounded-md w-full bg-background">
              <option>Select</option>
              <option>Rental</option>
              <option>Own</option>
            </select>
          </div>
        </div>

        {/* ===================== PARTICULAR + QTY ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-1">
            <Label>Particular</Label>
            <Input placeholder="Enter Particular (Diesel / Petrol / Oil)" />
          </div>

          <div className="space-y-1">
            <Label>Qty.</Label>
            <Input placeholder="Enter Qty" />
          </div>
        </div>

        {/* ===================== AMOUNT ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-1">
            <Label>Amount</Label>
            <Input placeholder="Enter Amount" />
          </div>

          <div className="space-y-1">
            <Label>Receipt No</Label>
            <Input placeholder="Enter Receipt No" />
          </div>
        </div>

        {/* ===================== RECEIPT UPLOAD ===================== */}
        <div className="space-y-1">
          <Label>Upload Receipt Photo</Label>
          <Button variant="outline" className="flex gap-2 w-full">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {/* ===================== ACTION BUTTONS ===================== */}
        <div className="flex gap-4 flex-wrap pt-4">
          <Button className="px-8">Save</Button>
          <Button variant="outline" className="px-8">Update</Button>

          <Button variant="outline" className="px-8">
            Reset
          </Button>

          <Button 
            variant="outline" 
            className="px-8 text-red-500 border-red-500 hover:bg-red-50"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
