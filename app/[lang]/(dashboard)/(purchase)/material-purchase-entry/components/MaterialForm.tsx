"use client";

import { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function MaterialForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [generatedOtp, setGeneratedOtp] = useState("");
  const [receiptOtpMatch, setReceiptOtpMatch] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [scanning, setScanning] = useState(false);

  // File input ref for vehicle photo
  const vehicleInputRef = useRef<HTMLInputElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  // ========================= OTP Generator =========================
  const generateOtp = () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setSaveDisabled(true);
    setReceiptOtpMatch(false);
  };

  // ========================= When Vehicle Photo is Uploaded =========================
  const handleVehiclePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // OTP generate only after uploading vehicle photo
    generateOtp();
  };

  // ========================= Receipt Photo Scan (Dummy) =========================
  const scanReceiptForOtp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);

    // Dummy OCR simulation (later real OCR)
    setTimeout(() => {
      if (!generatedOtp) {
        setReceiptOtpMatch(false);
        setSaveDisabled(true);
        setScanning(false);
        return;
      }

      const chance = Math.random();
      if (chance > 0.4) {
        setReceiptOtpMatch(true);
        setSaveDisabled(false);
      } else {
        setReceiptOtpMatch(false);
        setSaveDisabled(true);
      }

      setScanning(false);
    }, 1200);
  };

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-default-900">
          Material Purchase Entry
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* ========================= DATE ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* ========================= PARTY / SITE ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-1">
            <Label>Select Party</Label>
            <select className="border px-3 py-2 rounded-md bg-background w-full">
              <option>Select Material Party</option>
              <option>Hemant Chopda</option>
              <option>Kanker Supplier</option>
              <option>Rasani Supplier</option>
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

        {/* ========================= VEHICLE SECTION ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="space-y-1">
            <Label>Vehicle No.</Label>
            <Input placeholder="Enter Vehicle No..." />
          </div>

          <div className="space-y-1">
            <Label>Upload Vehicle Photo</Label>

            {/* Hidden Input */}
            <input
              type="file"
              accept="image/*"
              ref={vehicleInputRef}
              className="hidden"
              onChange={handleVehiclePhoto}
            />

            {/* Trigger Button */}
            <Button
              variant="outline"
              className="w-full flex gap-2"
              onClick={() => vehicleInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Upload Vehicle Photo
            </Button>

            {generatedOtp && (
              <p className="text-xs text-green-500">Auto OTP Generated: {generatedOtp}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Material</Label>
            <select className="border px-3 py-2 rounded-md w-full bg-background">
              <option>Select Material</option>
              <option>Sand</option>
              <option>Limestone</option>
              <option>Murum</option>
              <option>Other</option>
            </select>
          </div>

        </div>

        {/* ========================= SIZE / QTY ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <Label>Size</Label>
            <Input placeholder="Enter Size" />
          </div>

          <div className="space-y-1">
            <Label>Qty</Label>
            <Input placeholder="Enter Quantity" />
          </div>
        </div>

        {/* ========================= RECEIPT SECTION ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="space-y-1">
            <Label>Receipt No</Label>
            <Input placeholder="Enter Receipt No" />
          </div>

          <div className="space-y-1">
            <Label>Upload Receipt Photo</Label>

            {/* Hidden Input */}
            <input
              type="file"
              accept="image/*"
              ref={receiptInputRef}
              className="hidden"
              onChange={scanReceiptForOtp}
            />

            {/* Trigger Button */}
            <Button
              variant="outline"
              className="w-full flex gap-2"
              disabled={!generatedOtp}
              onClick={() => receiptInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {scanning ? "Scanning..." : "Upload Receipt"}
            </Button>

            {receiptOtpMatch ? (
              <p className="text-xs text-green-500">OTP Verified ✔</p>
            ) : generatedOtp ? (
              <p className="text-xs text-red-500">OTP Not Found in Receipt ❌</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label>Auto OTP</Label>
            <Input disabled value={generatedOtp} />
          </div>

        </div>

        {/* ========================= WARNING ========================= */}
        <div className="text-sm text-yellow-600 italic">
          Receipt must contain the same OTP generated from vehicle photo.
        </div>

        {/* ========================= ACTION BUTTONS ========================= */}
        <div className="flex gap-4 flex-wrap">
          <Button className="px-8" disabled={saveDisabled}>
            Save
          </Button>
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
