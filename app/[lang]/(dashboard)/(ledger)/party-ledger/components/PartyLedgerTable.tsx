"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Edit, Trash2, Eye } from "lucide-react";

export default function PartyLedgerTable() {
  const [search, setSearch] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [openPurchase, setOpenPurchase] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const partyList = ["Satish Enterprises", "Dev Traders", "Mahesh Suppliers"];

  // Dummy Ledger Data
  const allLedger = [
    { party: "Satish Enterprises", date: "17-07-24", site: "Vehicle Exp", through: "1 No 140", particular: "", received: 1500, payment: 0, balance: 1500 },
    { party: "Satish Enterprises", date: "06-11-24", site: "Vehicle Exp", through: "1 No 140", particular: "Grease", received: 11000, payment: 0, balance: 12500 },
    { party: "Satish Enterprises", date: "11-11-24", site: "Vehicle Exp", through: "1 No 140", particular: "Gear Guard", received: 5500, payment: 0, balance: 18000 },
    { party: "Satish Enterprises", date: "16-11-24", site: "Vehicle Exp", through: "2 No 140", particular: "", received: 12600, payment: 0, balance: 30600 },
    { party: "Satish Enterprises", date: "25-11-24", site: "Vehicle Exp", through: "1 No 140", particular: "", received: 4100, payment: 0, balance: 34700 },
    { party: "Satish Enterprises", date: "29-11-24", site: "Vehicle Exp", through: "", particular: "", received: 2400, payment: 0, balance: 37100 },
    { party: "Satish Enterprises", date: "06-12-24", site: "", through: "", particular: "", received: 0, payment: 37100, balance: 0 },
  ];

  const filteredData = selectedParty
    ? allLedger.filter((row) => row.party === selectedParty)
    : [];

  // Totals
  const totalReceived = filteredData.reduce((acc, r) => acc + r.received, 0);
  const totalPayment = filteredData.reduce((acc, r) => acc + r.payment, 0);
  const balance = totalReceived - totalPayment;

  return (
    <>
      <Card className="p-4 md:p-6 shadow-md border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold text-default-900">
            Party Ledger
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* SEARCH ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Search Party */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Search / Select Party</p>
              <Input
                placeholder="Search Party..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedParty(e.target.value);
                }}
                list="party-options"
              />

              <datalist id="party-options">
                {partyList.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Contact No</p>
              <Input placeholder="Enter Contact..." />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <Button
                className="w-full"
                disabled={!selectedParty}
                onClick={() => setOpenPurchase(true)}
              >
                Purchase Entry
              </Button>

              <Button
                className="w-full"
                disabled={!selectedParty}
                onClick={() => setOpenPayment(true)}
              >
                Payment Entry
              </Button>

              <Button className="w-full">Export</Button>
            </div>
          </div>

          {/* TOTAL CARDS */}
          {selectedParty && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">

              <div className="p-4 rounded-xl bg-green-800 text-white">
                <p>Total Received</p>
                <h2 className="text-2xl font-bold">₹ {totalReceived.toLocaleString()}</h2>
              </div>

              <div className="p-4 rounded-xl bg-red-800 text-white">
                <p>Total Pay</p>
                <h2 className="text-2xl font-bold">₹ {totalPayment.toLocaleString()}</h2>
              </div>

              <div className="p-4 rounded-xl bg-blue-800 text-white">
                <p>Balance</p>
                <h2 className="text-2xl font-bold">₹ {balance.toLocaleString()}</h2>
              </div>

            </div>
          )}

          {/* LEDGER TABLE */}
          <ScrollArea className="rounded-md border w-full overflow-auto max-h-[500px]">
            <div className="min-w-[1200px]">
              <table className="w-full table-auto">
                <thead className="bg-default-100 text-default-700 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Site</th>
                    <th className="p-3 text-left">Through</th>
                    <th className="p-3 text-left">Particular</th>
                    <th className="p-3 text-green-600 text-left">Received</th>
                    <th className="p-3 text-red-600 text-left">Payment</th>
                    <th className="p-3 text-left">Balance</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-default-50">
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">{row.site}</td>
                      <td className="p-3">{row.through}</td>
                      <td className="p-3">{row.particular}</td>
                      <td className="p-3 text-green-600">₹ {row.received}</td>
                      <td className="p-3 text-red-600">
                        {row.payment ? `₹ ${row.payment}` : ""}
                      </td>
                      <td className="p-3 font-semibold">
                        ₹ {row.balance}
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button size="icon" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setOpenDelete(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* DELETE CONFIRM POPUP */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-default-700">
            Are you sure you want to delete this entry?
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant="outline">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
