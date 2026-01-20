"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VehicleRentLogDialog from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentLogDialog";
import { API, normalizeList } from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/vehicle-rent.api";

import type {
  Site,
  VehicleRentVehicle,
} from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/vehicle-rent.types";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  const router = useRouter();

  const [sites, setSites] = useState<Site[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRentVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSites = async () => {
    const res = await fetch(`${API.sites}?_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    const list = (normalizeList(json) as Site[]).filter((s: any) => !s?.isDeleted);
    list.sort((a: any, b: any) => String(a.siteName || "").localeCompare(String(b.siteName || "")));
    setSites(list);
  };

  const loadVehicles = async () => {
    const res = await fetch(`${API.vehicles}?_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    setVehicles(normalizeList(json) as VehicleRentVehicle[]);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        await Promise.all([loadSites(), loadVehicles()]);
      } finally {
        setLoading(false);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-2xl font-medium text-default-800">Vehicle Logbook Entry</div>

      {loading ? (
        <div className="card p-6 rounded-md border">
          <p className="text-default-500">Loading...</p>
        </div>
      ) : (
        <VehicleRentLogDialog
          open={true}
          onClose={() => router.push("/vehicle-rent-ledger")}
          mode="CREATE"
          sites={sites}
          vehicles={vehicles}
          onSaved={() => router.push("/vehicle-rent-ledger")}
        />
      )}
    </div>
  );
}
