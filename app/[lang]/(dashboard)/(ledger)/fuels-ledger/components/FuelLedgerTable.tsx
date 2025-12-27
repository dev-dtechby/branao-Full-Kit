"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import FuelPurchaseForm from "@/app/[lang]/(dashboard)/(purchase)/fuels-purchase-entry/components/FuelPurchaseForm";
import FuelAmountReceive from "./fuelAmountReceive";

import { Eye, Pencil, Trash2 } from "lucide-react";

// ====================== MAIN COMPONENT ======================
export default function FuelLedgerTable() {
  const [search, setSearch] = useState("");
  const [selectedStation, setSelectedStation] = useState("");

  const [openPurchaseForm, setOpenPurchaseForm] = useState(false);
  const [openAmountForm, setOpenAmountForm] = useState(false);
  const [openViewPopup, setOpenViewPopup] = useState<any | null>(null);
  const [openEditPopup, setOpenEditPopup] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  const fuelStationList = ["Patan Fuel", "Vaishnav Fuel", "IDFC Pump"];

  // Dummy Ledger Data
  const allLedgerData = [
    {
      station: "Patan Fuel",
      date: "13-11-25",
      site: "Patan",
      receipt: "2201",
      through: "Vaishnav",
      purchaseType: "Own",
      vehicle: "Rajesh 140",
      particular: "Diesel",
      qty: 100,
      received: 9359,
      payment: 0,
      balance: 9359,
    },
    {
      station: "Patan Fuel",
      date: "14-11-25",
      site: "Patan",
      receipt: "2202",
      through: "Vaishnav",
      purchaseType: "Own",
      vehicle: "Rajesh 140",
      particular: "Diesel",
      qty: 100,
      received: 9359,
      payment: 18718,
      balance: 18718,
    },
    {
      station: "Patan Fuel",
      date: "14-11-25",
      site: "Patan",
      receipt: "2203",
      through: "Vaishnav",
      purchaseType: "Rental",
      vehicle: "Tractor John Dear",
      particular: "Diesel",
      qty: 30,
      received: 2808,
      payment: 21526,
      balance: 21526,
    },
    {
      station: "Patan Fuel",
      date: "16-11-25",
      site: "Patan",
      receipt: "2204",
      through: "Vaishnav",
      purchaseType: "Rental",
      vehicle: "Tractor John Dear",
      particular: "Diesel",
      qty: 40,
      received: 3744,
      payment: 25269,
      balance: 25269,
    },
    {
      station: "Patan Fuel",
      date: "18-11-25",
      site: "Patan",
      receipt: "",
      through: "IDFC",
      purchaseType: "",
      vehicle: "",
      particular: "",
      qty: "",
      received: 0,
      payment: 50000,
      balance: -24731,
    },
  ];

  const filteredData = selectedStation
    ? allLedgerData.filter((row) => row.station === selectedStation)
    : [];

  // Calculate Totals
  const totalReceived = filteredData.reduce(
    (sum, item) => sum + (item.received || 0),
    0
  );

  const totalPay = filteredData.reduce(
    (sum, item) => sum + (item.payment || 0),
    0
  );

  const totalDiesel = filteredData
    .filter((i) => i.particular === "Diesel")
    .reduce((sum, i) => sum + Number(i.qty ?? 0), 0);

  const totalPetrol = filteredData
    .filter((i) => i.particular === "Petrol")
    .reduce((sum, i) => sum + Number(i.qty ?? 0), 0);

  return (
    <>
      {/* ================= CARD ================= */}
      <Card className="p-4 md:p-6 shadow-sm border rounded-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Fuel Station Ledger
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Search / Select Fuel Station..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedStation(e.target.value);
                }}
                list="fuel-options"
              />
              <datalist id="fuel-options">
                {fuelStationList.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="flex gap-3 md:ml-auto">
              <Button
                onClick={() => setOpenPurchaseForm(true)}
                disabled={!selectedStation}
              >
                Fuel Purchase Entry
              </Button>

              <Button
                onClick={() => setOpenAmountForm(true)}
                disabled={!selectedStation}
              >
                Amount Received
              </Button>

              <Button>Export</Button>
            </div>
          </div>

          {/* Info Box */}
          {selectedStation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted border">
              <div>
                <p className="text-xs text-muted-foreground">Fuel Station</p>
                <p className="font-semibold">{selectedStation}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p>—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p>9876543210</p>
              </div>
            </div>
          )}

          {/* Total Cards */}
          {selectedStation && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-green-900 text-white p-4 rounded-xl">
                <p>Total Received</p>
                <h2 className="text-2xl font-bold">₹ {totalReceived}</h2>
              </div>

              <div className="bg-red-900 text-white p-4 rounded-xl">
                <p>Total Pay</p>
                <h2 className="text-2xl font-bold">₹ {totalPay}</h2>
              </div>

              <div className="bg-blue-900 text-white p-4 rounded-xl">
                <p>Balance</p>
                <h2 className="text-2xl font-bold">₹ {totalReceived - totalPay}</h2>
              </div>

              <div className="bg-yellow-700 text-white p-4 rounded-xl">
                <p>Total Diesel Ltr</p>
                <h2 className="text-2xl font-bold">{totalDiesel}</h2>
              </div>

              <div className="bg-purple-700 text-white p-4 rounded-xl">
                <p>Total Petrol Ltr</p>
                <h2 className="text-2xl font-bold">{totalPetrol}</h2>
              </div>
            </div>
          )}

          {/* TABLE - SCROLL ENABLED */}
          <ScrollArea className="rounded-md border w-full max-h-[500px] overflow-auto">
            <div className="min-w-[1500px]">
              <table className="w-full table-auto">
                <thead className="bg-default-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Site</th>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Through</th>
                    <th className="p-3">Purchase Type</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Particular</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3 text-green-500">Received</th>
                    <th className="p-3 text-red-500">Payment</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-default-50 transition"
                    >
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">{row.site}</td>
                      <td className="p-3">{row.receipt}</td>
                      <td className="p-3">{row.through}</td>
                      <td className="p-3">{row.purchaseType}</td>
                      <td className="p-3">{row.vehicle}</td>
                      <td className="p-3">{row.particular}</td>
                      <td className="p-3">{row.qty}</td>
                      <td className="p-3 text-green-600">₹ {row.received}</td>
                      <td className="p-3 text-red-600">
                        {row.payment ? `₹ ${row.payment}` : ""}
                      </td>

                      <td className="p-3 font-semibold">
                        {row.balance < 0
                          ? `-₹ ${Math.abs(row.balance)}`
                          : `₹ ${row.balance}`}
                      </td>

                      <td className="p-3 flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setOpenViewPopup(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setOpenEditPopup(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setDeleteItem(row)}
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

      {/* POPUP 1 - Purchase Form */}
      <Dialog open={openPurchaseForm} onOpenChange={setOpenPurchaseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fuel Purchase Entry</DialogTitle>
          </DialogHeader>

          <FuelPurchaseForm
            station={selectedStation}
            onClose={() => setOpenPurchaseForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* POPUP 2 - Amount Received */}
      <Dialog open={openAmountForm} onOpenChange={setOpenAmountForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Amount Received</DialogTitle>
          </DialogHeader>

          <FuelAmountReceive
            station={selectedStation}
            onClose={() => setOpenAmountForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* POPUP 3 - View */}
      <Dialog open={!!openViewPopup} onOpenChange={() => setOpenViewPopup(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>View Details</DialogTitle>
          </DialogHeader>

          {openViewPopup && (
            <div className="space-y-2">
              {Object.entries(openViewPopup).map(([key, val]) => (
                <p key={key} className="text-sm">
                  <strong>{key}:</strong> {String(val ?? "-")}
                </p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* POPUP 4 - Edit Form */}
      <Dialog open={!!openEditPopup} onOpenChange={() => setOpenEditPopup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>

          {openEditPopup && (
            <div className="space-y-4">
              {Object.entries(openEditPopup).map(([key, val]) => (
                <div key={key}>
                  <label className="text-sm font-medium">{key}</label>
                  <Input defaultValue={String(val ?? "")} className="mt-1" />
                </div>
              ))}

              <Button className="w-full mt-4">Update</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* POPUP 5 - Delete Confirm */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>

          <p className="text-sm">
            Are you sure you want to delete this record?
          </p>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setDeleteItem(null);
                alert("Deleted Successfully");
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
