"use client";

import { useRouter } from "next/navigation";
import VehicleRentEntryForm from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentEntryForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="text-2xl font-medium text-default-800">Vehicle Rent Entry</div>

      {/* ✅ Directly open VehicleRentEntryForm */}
      <VehicleRentEntryForm
        open={true}
        onClose={() => router.push("/vehicle-rent-ledger")}
        onCreated={async () => {
          router.push("/vehicle-rent-ledger");
        }}
      />
    </div>
  );
}
