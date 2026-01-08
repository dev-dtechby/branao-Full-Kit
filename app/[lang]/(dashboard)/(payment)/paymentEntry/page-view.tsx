"use client";

import PaymentsEntry from "./components/paymentsEntry";

export default function PageView({ trans }: { trans: any }) {
  return (
    <div className="space-y-6">
      <div className="card p-6 rounded-md border shadow-sm">
        <PaymentsEntry trans={trans} />
      </div>
    </div>
  );
}
