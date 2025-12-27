"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LedgerForm() {
  const [ledgerType, setLedgerType] = useState<"staff" | "party">("staff");

  const handleChange = (e: any, type: "staff" | "party") => {
    console.log(type, e.target.name, e.target.value);
  };

  return (
    <div className="space-y-6">

      {/* ------- Radio Selector ------- */}
      <Card className="p-5 border rounded-md shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Select Ledger Type</h3>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="ledgerType"
              value="staff"
              checked={ledgerType === "staff"}
              onChange={() => setLedgerType("staff")}
            />
            <span className="text-default-700">Staff Ledger</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="ledgerType"
              value="party"
              checked={ledgerType === "party"}
              onChange={() => setLedgerType("party")}
            />
            <span className="text-default-700">Party Ledger</span>
          </label>
        </div>
      </Card>

      {/* ============================================================= */}
      {/*                  STAFF LEDGER FORM                           */}
      {/* ============================================================= */}

      {ledgerType === "staff" && (
        <Card className="p-6 border rounded-md shadow-md space-y-6">
          <h3 className="text-xl font-semibold">Create Staff Ledger</h3>

          {/* TOP ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <Label className="text-default-600">Ledger Type</Label>
              <Input name="ledgerType" placeholder="Select Ledger Type" />
            </div>

            <div>
              <Label className="text-default-600">Site</Label>
              <Input name="site" placeholder="Select Site" />
            </div>

            <div>
              <Label className="text-default-600">Address</Label>
              <Input name="address" placeholder="Address" />
            </div>

          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-default-600">Name of Ledger</Label>
              <Input name="ledgerName" placeholder="Enter Ledger Name" />
            </div>

            <div>
              <Label className="text-default-600">Mobile No</Label>
              <Input name="mobile" placeholder="Mobile No" />
            </div>
          </div>

          {/* Row 3 — Amount Out */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-green-600 font-semibold">Amt / Out</Label>
              <Input name="amountOut" placeholder="Amount" />
            </div>

            <div>
              <Label className="text-red-600 font-semibold">Received / In</Label>
              <Input name="receivedIn" placeholder="Received Amount" />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button className="px-6">Save</Button>

            <Button variant="outline" className="px-6">
              Update
            </Button>

            <Button variant="outline" className="px-6">
              Reset
            </Button>
          </div>
        </Card>
      )}

      {/* ============================================================= */}
      {/*                  PARTY LEDGER FORM                           */}
      {/* ============================================================= */}

      {ledgerType === "party" && (
        <Card className="p-6 border rounded-md shadow-md space-y-6">
          <h3 className="text-xl font-semibold">Create Party Ledger</h3>

          {/* TOP ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Ledger Type</Label>
              <Input name="ledgerType" placeholder="Select Ledger Type" />
            </div>

            <div>
              <Label>Site</Label>
              <Input name="site" placeholder="Select Site" />
            </div>

            <div>
              <Label>Address</Label>
              <Input name="address" placeholder="Address" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name of Ledger</Label>
              <Input name="ledgerName" placeholder="Enter Ledger Name" />
            </div>

            <div>
              <Label>Mobile No</Label>
              <Input name="mobile" placeholder="Mobile No" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-green-600 font-semibold">Opening Balance</Label>
              <Input name="openingBalance" placeholder="Opening Balance" />
            </div>

            <div>
              <Label className="text-red-600 font-semibold">Closing Balance</Label>
              <Input name="closingBalance" placeholder="Closing Balance" />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button className="px-6">Save</Button>

            <Button variant="outline" className="px-6">
              Update
            </Button>

            <Button variant="outline" className="px-6">
              Reset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
