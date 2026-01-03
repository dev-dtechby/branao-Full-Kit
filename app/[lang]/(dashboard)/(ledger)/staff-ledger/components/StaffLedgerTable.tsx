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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

import StaffExpEntryForm from "./StaffExpEntryForm";
import StaffAmountReceive from "./StaffAmountReceive";
import EditStaffLedger from "./EditStaffLedger";
import { StaffExpense } from "./types";

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

  const [entries, setEntries] = useState<StaffExpense[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Edit row state
  const [editRow, setEditRow] =
    useState<StaffExpense | null>(null);

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
            l.ledgerType?.name
              ?.toLowerCase()
              .includes("staff") ||
            l.ledgerType?.name
              ?.toLowerCase()
              .includes("supervisor")
        ) ?? [];

      setStaffLedgers(filtered);
    } catch (err) {
      console.error("Failed to fetch ledgers", err);
      setStaffLedgers([]);
    }
  };

  /* ================= FETCH LEDGER ENTRIES ================= */
  useEffect(() => {
    if (!selectedLedger?.id) {
      setEntries([]);
      return;
    }
    fetchEntries(selectedLedger.id);
  }, [selectedLedger]);

  const fetchEntries = async (staffLedgerId: string) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/api/staff-expense?staffLedgerId=${staffLedgerId}`,
        { credentials: "include" }
      );

      const json = await res.json();
      setEntries(json?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch ledger entries", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STAFF NAME LIST ================= */
  const staffNameList = useMemo(
    () => staffLedgers.map((l) => l.name),
    [staffLedgers]
  );

  /* ================= RUNNING BALANCE ================= */
  const rowsWithBalance = useMemo(() => {
    let balance = 0;

    return [...entries]
      .sort(
        (a, b) =>
          new Date(a.expenseDate).getTime() -
          new Date(b.expenseDate).getTime()
      )
      .map((row) => {
        balance +=
          (row.inAmount || 0) - (row.outAmount || 0);
        return { ...row, balance };
      });
  }, [entries]);

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-4 md:p-6 border rounded-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">
            Staff Ledger
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ===== Search + Buttons ===== */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Search / Select Staff..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);

                  const ledger = staffLedgers.find(
                    (l) => l.name === val
                  );

                  setSelectedLedger(ledger || null);
                }}
                list="staff-options"
              />
              <datalist id="staff-options">
                {staffNameList.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="flex gap-2 md:ml-auto flex-wrap">
              <Button
                disabled={!selectedLedger}
                onClick={() => setOpenForm("exp")}
              >
                Expense Entry
              </Button>

              <Button
                variant="outline"
                disabled={!selectedLedger}
                onClick={() => setOpenForm("received")}
              >
                Amount Received
              </Button>

              <Button
                variant="outline"
                disabled={!selectedLedger}
              >
                Export
              </Button>
            </div>
          </div>

          {/* ===== Staff Info ===== */}
          {selectedLedger && (
            <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted">
              <div>
                <p className="text-xs">Account Of</p>
                <p className="font-semibold">
                  {selectedLedger.name}
                </p>
              </div>
              <div>
                <p className="text-xs">Address</p>
                <p>{selectedLedger.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs">Contact</p>
                <p>{selectedLedger.mobile || "—"}</p>
              </div>
            </div>
          )}

          {/* ================= LEDGER TABLE ================= */}
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              className="w-full text-sm"
              style={{ minWidth: 1200 }}
            >
              <thead className="bg-default-100">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Site</th>
                  <th className="p-3">Expense</th>
                  <th className="p-3">Summary</th>
                  <th className="p-3">Remark</th>
                  <th className="p-3 text-green-600">
                    Received (In)
                  </th>
                  <th className="p-3 text-red-500">
                    Payment (Out)
                  </th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {!selectedLedger && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Please select a staff ledger
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                )}

                {rowsWithBalance.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-muted/50"
                  >
                    <td className="p-3">
                      {new Date(row.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {row.site?.siteName || "—"}
                    </td>
                    <td className="p-3">
                      {row.expenseTitle}
                    </td>
                    <td className="p-3">
                      {row.summary || "—"}
                    </td>
                    <td className="p-3">
                      {row.remark || "—"}
                    </td>
                    <td className="p-3 text-green-600">
                      {row.inAmount ?? ""}
                    </td>
                    <td className="p-3 text-red-500">
                      {row.outAmount ?? ""}
                    </td>
                    <td className="p-3 font-semibold">
                      {row.balance}
                    </td>
                    <td className="p-3 flex gap-2">
                      <Pencil
                        className="h-4 w-4 cursor-pointer text-blue-500"
                        onClick={() => setEditRow(row)}
                      />
                      <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Expense Popup ===== */}
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
              onClose={() => {
                setOpenForm(null);
                fetchEntries(selectedLedger.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Received Popup ===== */}
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
              onClose={() => {
                setOpenForm(null);
                fetchEntries(selectedLedger.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Edit Popup ===== */}
      <Dialog
        open={!!editRow}
        onOpenChange={() => setEditRow(null)}
      >
        <DialogContent className="max-w-xl">
          {editRow && (
            <EditStaffLedger
              row={editRow}
              onClose={() => setEditRow(null)}
              onUpdated={() =>
                selectedLedger &&
                fetchEntries(selectedLedger.id)
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
