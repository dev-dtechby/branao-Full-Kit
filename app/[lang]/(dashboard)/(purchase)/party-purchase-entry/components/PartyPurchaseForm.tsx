"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function PartyPurchaseForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-6 rounded-xl shadow-sm border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-default-900">
          Other Party Purchase Entry
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* ================= DATE / PARTY / SITE ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* DATE */}
          <div className="space-y-1">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger>
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
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          {/* PARTY */}
          <div className="space-y-1">
            <Label>Select Party</Label>
            <select className="border px-3 py-2 rounded-md w-full bg-background">
              <option>Select Party</option>
              <option>Supplier A</option>
              <option>Supplier B</option>
              <option>Supplier C</option>
            </select>
          </div>

          {/* SITE */}
          <div className="space-y-1">
            <Label>Select Site</Label>
            <select className="border px-3 py-2 rounded-md w-full bg-background">
              <option>Select Site</option>
              <option>Dev Site</option>
              <option>Kondagaon Site</option>
              <option>Rasani Site</option>
            </select>
          </div>
        </div>

        {/* ================= PARTICULAR / SIZE / QTY ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PARTICULAR */}
          <div className="space-y-1">
            <Label>Particular</Label>
            <Input placeholder="Enter Particular" />
          </div>

          {/* SIZE */}
          <div className="space-y-1">
            <Label>Size</Label>
            <Input placeholder="Enter Size" />
          </div>

          {/* QTY */}
          <div className="space-y-1">
            <Label>Qty</Label>
            <Input placeholder="Enter Quantity" />
          </div>
        </div>

        {/* ================= TOTAL AMOUNT ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1 md:col-span-2">
            <Label>Total Amount</Label>
            <Input placeholder="Enter Total Amount" />
          </div>
        </div>

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex gap-4 pt-4">
          <Button className="px-8">Save</Button>

          <Button variant="outline" className="px-8">
            Update
          </Button>

          <Button variant="outline" className="px-8">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
