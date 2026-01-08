"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/* ========= EXPORT UTILS ========= */
import { exportSummaryToExcel, exportSummaryToPDF } from "./ExportSummary";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

interface Expense {
  id: string;
  site: { siteName: string };
  summary: string;
  amount: number;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const EXP_API = `${BASE_URL}/api/site-exp`;

export default function SiteSummaryCards() {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("");

  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    fetch(SITE_API)
      .then((r) => r.json())
      .then((j) => setSites(j.data || []))
      .catch(() => setSites([]));
  }, []);

  /* ================= LOAD EXPENSES ================= */
  useEffect(() => {
    fetch(EXP_API)
      .then((r) => r.json())
      .then((j) => setExpenses(j.data || []))
      .catch(() => setExpenses([]));
  }, []);

  /* ================= SUMMARY GROUPING ================= */
  const summaryRows = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((exp) => {
      if (selectedSite && exp.site?.siteName !== selectedSite) return;
      const key = exp.summary || "Other";
      map.set(key, (map.get(key) || 0) + Number(exp.amount || 0));
    });

    return Array.from(map.entries()).map(([summary, amount]) => ({
      summary,
      amount,
    }));
  }, [expenses, selectedSite]);

  /* ================= GLOBAL SEARCH ================= */
  const filtered = summaryRows.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.summary.toLowerCase().includes(q) ||
      String(v.amount).includes(q)
    );
  });

  /* ================= TOTAL ================= */
  const totalAmount = filtered.reduce((sum, v) => sum + v.amount, 0);

  /* ================= EXPORT DATA ================= */
const exportRows = summaryRows; // ✅ selectedSite applied, search ignored

const exportData = [
  ...exportRows.map((row) => ({
    Site: selectedSite || "All Sites",
    "Expense Summary": row.summary,
    Amount: row.amount,
  })),
  ...(exportRows.length
    ? [
        {
          Site: selectedSite || "All Sites",
          "Expense Summary": "TOTAL",
          Amount: exportRows.reduce((sum, v) => sum + v.amount, 0),
        },
      ]
    : []),
];

  return (
    <Card className="p-6 border rounded-xl shadow-sm">
      {/* ================= HEADER ================= */}
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <CardTitle className="text-xl font-semibold">
            Summary Wise Expenses
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            <Input
              placeholder="Global Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-56"
            />

            <select
              className="border bg-background px-3 py-2 rounded-md text-sm md:w-44"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="">Select Site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.siteName}>
                  {site.siteName}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  exportSummaryToExcel(
                    exportData as any,
                    `summary-wise-expenses_${selectedSite || "all"}`
                  )
                }
              >
                Excel
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  exportSummaryToPDF(exportData as any, "summary-wise-expenses_all", {
                    title: `Summary Wise Expenses - ${selectedSite || "All Sites"}`,
                  })
                }
              >
                PDF
              </Button>

            </div>
          </div>
        </div>
      </CardHeader>

      {/* ================= TABLE (FINAL FORCE SCROLL) ================= */}
      <CardContent className="p-0">
        {/* 🔥 INLINE CSS — NOTHING CAN BLOCK THIS */}
        <div
          style={{
            width: "100%",
            maxWidth: "100vw",
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          <div style={{ minWidth: "600px" }}>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/60 sticky top-0 border-b">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    Exp. Summary
                  </th>
                  <th className="px-4 py-2 text-right whitespace-nowrap">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t transition hover:bg-primary/10"
                  >
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      {row.summary}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold whitespace-nowrap">
                      ₹ {row.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No Records Found
                    </td>
                  </tr>
                )}

                {filtered.length > 0 && (
                  <tr className="font-semibold border-t bg-muted/40">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right">
                      ₹ {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
