"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddMaterial from "./addMaterial";

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const SUPPLIER_API = `${BASE_URL}/api/material-suppliers`;
const SITE_API = `${BASE_URL}/api/sites`;

/* ================= TYPES ================= */
type Supplier = {
  id: string;
  name: string;
  contactNo?: string | null;
};

type Site = {
  id: string;
  siteName: string;
};

export default function MaterialForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  /* ================= DROPDOWN DATA ================= */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSup, setLoadingSup] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  /* ================= SELECTED ================= */
  const [supplierId, setSupplierId] = useState("");
  const [siteId, setSiteId] = useState("");

  /* ================= OTP STATES ================= */
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [receiptOtpMatch, setReceiptOtpMatch] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [scanning, setScanning] = useState(false);

  // File input ref
  const vehicleInputRef = useRef<HTMLInputElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const [openAddMaterial, setOpenAddMaterial] = useState(false);

  /* ================= LOAD SUPPLIERS + SITES ================= */
  useEffect(() => {
    (async () => {
      try {
        setLoadingSup(true);
        const res = await fetch(SUPPLIER_API, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSuppliers(Array.isArray(data) ? data : data?.data || []);
        } else {
          setSuppliers([]);
        }
      } catch (e) {
        console.error(e);
        setSuppliers([]);
      } finally {
        setLoadingSup(false);
      }
    })();

    (async () => {
      try {
        setLoadingSites(true);
        const res = await fetch(SITE_API, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSites(Array.isArray(data) ? data : data?.data || []);
        } else {
          setSites([]);
        }
      } catch (e) {
        console.error(e);
        setSites([]);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, []);

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
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-default-900">
          Material Purchase Entry
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ========================= TOP (DATE + SUPPLIER + SITE) ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DATE */}
          <div className="space-y-1">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "h-10 w-full flex items-center justify-between px-3 rounded-md border bg-background text-sm"
                  )}
                >
                  {date ? date.toLocaleDateString() : "Select Date"}
                  <CalendarIcon className="h-4 w-4 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          {/* MATERIAL SUPPLIER */}
          <div className="space-y-1">
            <Label>Material Supplier</Label>
            <select
              className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">
                {loadingSup ? "Loading suppliers..." : "Select Material Supplier"}
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* SITE */}
          <div className="space-y-1">
            <Label>Select Site</Label>
            <select
              className="border px-3 py-2 rounded-md bg-background w-full h-10 text-sm"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">
                {loadingSites ? "Loading sites..." : "Select Site"}
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ========================= VEHICLE SECTION ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <Label>Vehicle No.</Label>
            <Input placeholder="Enter Vehicle No..." className="h-10" />
          </div>

          <div className="space-y-1">
            <Label>Upload Vehicle Photo</Label>

            <input
              type="file"
              accept="image/*"
              ref={vehicleInputRef}
              className="hidden"
              onChange={handleVehiclePhoto}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full flex gap-2 h-10"
              onClick={() => vehicleInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Upload Vehicle Photo
            </Button>

            {generatedOtp && (
              <p className="text-xs text-green-500">
                Auto OTP Generated: {generatedOtp}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Material</Label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => setOpenAddMaterial(true)}
              >
                + Add Material
              </Button>
            </div>

            <select className="border px-3 py-2 rounded-md w-full bg-background h-10 text-sm">
              <option value="">Select Material</option>
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
            <Input placeholder="Enter Size" className="h-10" />
          </div>

          <div className="space-y-1">
            <Label>Qty</Label>
            <Input placeholder="Enter Quantity" className="h-10" />
          </div>
        </div>

        {/* ========================= RECEIPT SECTION ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <Label>Receipt No</Label>
            <Input placeholder="Enter Receipt No" className="h-10" />
          </div>

          <div className="space-y-1">
            <Label>Upload Receipt Photo</Label>

            <input
              type="file"
              accept="image/*"
              ref={receiptInputRef}
              className="hidden"
              onChange={scanReceiptForOtp}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full flex gap-2 h-10"
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
            <Input disabled value={generatedOtp} className="h-10" />
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
