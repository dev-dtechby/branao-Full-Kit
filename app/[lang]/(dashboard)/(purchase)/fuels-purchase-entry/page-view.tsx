"use client";

import FuelPurchaseForm from "./components/FuelPurchaseForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      {/* <div className="text-2xl font-medium text-default-800">
        Fuel Purchase Entry
      </div> */}

      {/* Main Card */}
      <div className="card p-6 rounded-md border shadow-sm">
        
        {/* Header */}
        {/* <h3 className="text-lg font-semibold mb-4">
          Fuel Purchase Form
        </h3> */}

        {/* Inject the Form Component */}
        <FuelPurchaseForm station="-" onClose={() => {}} />

      </div>
    </div>
  );
}
