"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import StaffExpEntryForm from "./StaffExpEntryForm";
import StaffAmountReceive from "./StaffAmountReceive";

/* ================= TYPES ================= */
interface Ledger {
  id: string;
  name: string;
  address?: string | null;
  mobile?: string | null;
  ledgerType?: { name: string } | null;
}

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= COMPONENT ================= */
export default function StaffLedgerTable() {
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] =
    useState<"exp" | "received" | null>(null);

  const [staffLedgers, setStaffLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] =
    useState<Ledger | null>(null);

  /* ================= FETCH STAFF / SUPERVISOR LEDGERS ================= */
  useEffect(() => {
    fetchStaffLedgers();
  }, []);

  const fetchStaffLedgers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/ledgers`, {
        credentials: "include",
      });

      const json = await res.json();

      const filtered =
        json?.data?.filter(
          (l: Ledger) =>
            l.ledgerType?.name &&
            l.ledgerType.name
              .toLowerCase()
              .includes("staff")
            ||
            l.ledgerType?.name
              ?.toLowerCase()
              .includes("supervisor")
        ) ?? [];


      setStaffLedgers(filtered);
    } catch (err) {
      console.error("Failed to fetch staff ledgers", err);
      setStaffLedgers([]);
    }
  };

  /* ================= STAFF NAME LIST ================= */
const staffNameList = useMemo(
  () =>
    staffLedgers
      .map((l) => l.name)
      .filter(Boolean),
  [staffLedgers]
);

  /* ================= UI ================= */
  return (
    <>
      {/* ================= MAIN CARD ================= */}
      <Card className="p-4 md:p-6 shadow-sm border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">
            Staff Ledger
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* -------- Search + Buttons -------- */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            {/* Staff Search */}
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Search / Select Staff..."
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearch(value);

                  const ledger = staffLedgers.find(
                    (l) => l.name === value
                  );

                  setSelectedLedger(ledger || null);
                }}
                list="staff-options"
              />

              <datalist id="staff-options">
                {staffNameList.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Button
                onClick={() => setOpenForm("exp")}
                disabled={!selectedLedger}
              >
                Expense Entry
              </Button>

              <Button
                variant="outline"
                onClick={() => setOpenForm("received")}
                disabled={!selectedLedger}
              >
                Amount Received
              </Button>

              <Button variant="outline">
                Export
              </Button>
            </div>
          </div>

          {/* -------- Staff Info Box -------- */}
          {selectedLedger && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground">
                  Account Of
                </p>
                <p className="font-semibold">
                  {selectedLedger.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Address
                </p>
                <p>
                  {selectedLedger.address || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Contact No
                </p>
                <p>
                  {selectedLedger.mobile || "—"}
                </p>
              </div>
            </div>
          )}

          {/* -------- Ledger Table Placeholder -------- */}
          <ScrollArea className="rounded-md border w-full overflow-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-default-100">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Site</th>
                  <th className="p-3 text-left">Summary</th>
                  <th className="p-3 text-left">Through</th>
                  <th className="p-3 text-left text-red-500">
                    Out
                  </th>
                  <th className="p-3 text-left text-green-500">
                    In
                  </th>
                  <th className="p-3 text-left">
                    Balance
                  </th>
                  <th className="p-3 text-left">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {!selectedLedger && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center p-6 text-muted-foreground"
                    >
                      Please select a staff to view ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ================= EXPENSE ENTRY POPUP ================= */}
      <Dialog
        open={openForm === "exp"}
        onOpenChange={() => setOpenForm(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Expense Entry</DialogTitle>
          </DialogHeader>

          {selectedLedger && (
            <StaffExpEntryForm
              staffLedger={selectedLedger}
              onClose={() => setOpenForm(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ================= AMOUNT RECEIVED POPUP ================= */}
      <Dialog
        open={openForm === "received"}
        onOpenChange={() => setOpenForm(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Amount Received</DialogTitle>
          </DialogHeader>

          {selectedLedger && (
            <StaffAmountReceive
              staffLedger={{
                id: selectedLedger.id,
                name: selectedLedger.name,
              }}
              onClose={() => setOpenForm(null)}
            />
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
