"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, MoreHorizontal } from "lucide-react";

import {
  exportSiteProfitToExcel,
  exportSiteProfitToPDF,
} from "./siteProfitExportUtils";

/* ================= STATUS OPTIONS ================= */
const STATUS_OPTIONS = ["NOT_STARTED", "ONGOING", "COMPLETED", "ON_HOLD"] as const;

type SiteStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_LABEL: Record<SiteStatus, string> = {
  NOT_STARTED: "Not Started",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

const statusColors: Record<SiteStatus, string> = {
  NOT_STARTED: "bg-gray-500/20 text-gray-400",
  ONGOING: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  ON_HOLD: "bg-yellow-500/20 text-yellow-400",
};

/* ================= TYPES ================= */
interface SiteProfitRow {
  siteId: string;
  department: string;
  siteName: string;
  expenses: number;
  amountReceived: number;
  profit: number;
  status: SiteStatus | string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function SiteProfitChart() {
  const [data, setData] = useState<SiteProfitRow[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  // ✅ menus separated (row menu vs export menu)
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [openExportMenu, setOpenExportMenu] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BASE_URL}/api/site-profit?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      // ✅ handle both shapes:
      // 1) array directly
      // 2) { success, count, data: [] }
      const rows: SiteProfitRow[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setData(rows);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load profit data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= STATUS CHANGE (FRONTEND ONLY) ================= */
  const handleStatusChange = (siteId: string, status: SiteStatus) => {
    setData((prev) =>
      prev.map((row) => (row.siteId === siteId ? { ...row, status } : row))
    );
    setOpenRowMenu(null);
  };

  /* ================= FILTER OPTIONS ================= */
  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set((data || []).map((d) => d.department)))];
  }, [data]);

  /* ================= GLOBAL SEARCH ================= */
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return (data || []).filter((row) => {
      const deptMatch = department === "All" || row.department === department;

      const globalMatch =
        row.siteName?.toLowerCase().includes(q) ||
        row.department?.toLowerCase().includes(q) ||
        String(row.status || "").toLowerCase().includes(q) ||
        String(row.expenses ?? "").includes(q) ||
        String(row.amountReceived ?? "").includes(q) ||
        String(row.profit ?? "").includes(q);

      return deptMatch && globalMatch;
    });
  }, [data, search, department]);

  /* ================= TOTALS ================= */
  const totalExpense = filteredData.reduce((sum, r) => sum + (Number(r.expenses) || 0), 0);
  const totalReceived = filteredData.reduce((sum, r) => sum + (Number(r.amountReceived) || 0), 0);
  const totalProfit = totalReceived - totalExpense;

  return (
    <div className="space-y-4">
      {/* ================= TOP BAR ================= */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <select
            className="border rounded-md px-3 py-2 bg-background text-sm"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>

          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
        </div>

        {/* ================= EXPORT ================= */}
        <div className="relative">
          <Button
            className="flex gap-2"
            onClick={() => setOpenExportMenu((p) => !p)}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          {openExportMenu && (
            <div className="absolute right-0 mt-2 z-30 bg-default-100 border rounded-md shadow-md w-40">
              <div
                className="px-3 py-2 text-sm cursor-pointer hover:bg-default-200"
                onClick={() => {
                  exportSiteProfitToExcel(filteredData, "Site-Profit-Report");
                  setOpenExportMenu(false);
                }}
              >
                Export Excel
              </div>

              <div
                className="px-3 py-2 text-sm cursor-pointer hover:bg-default-200"
                onClick={() => {
                  exportSiteProfitToPDF(filteredData, "Site-Profit-Report");
                  setOpenExportMenu(false);
                }}
              >
                Export PDF
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: "1100px" }} className="w-full border-collapse">
          <thead className="bg-default-100 text-default-700">
            <tr>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Site Name</th>
              <th className="p-3 text-left">Expenses</th>
              <th className="p-3 text-left">Amt Received</th>
              <th className="p-3 text-left">Profit</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Summary</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 && (
              <tr className="border-t">
                <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                  {loading ? "Loading..." : "No records found"}
                </td>
              </tr>
            )}

            {filteredData.map((row) => {
              const st = (STATUS_OPTIONS.includes(row.status as any)
                ? (row.status as SiteStatus)
                : "NOT_STARTED") as SiteStatus;

              return (
                <tr key={row.siteId} className="border-t">
                  <td className="p-3">{row.department}</td>
                  <td className="p-3">{row.siteName}</td>

                  <td className="p-3 text-red-500 font-semibold">
                    ₹ {(Number(row.expenses) || 0).toLocaleString()}
                  </td>

                  <td className="p-3 text-green-500 font-semibold">
                    ₹ {(Number(row.amountReceived) || 0).toLocaleString()}
                  </td>

                  <td
                    className={`p-3 font-bold ${
                      (Number(row.profit) || 0) >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ₹ {(Number(row.profit) || 0).toLocaleString()}
                  </td>

                  {/* ================= STATUS ================= */}
                  <td className="p-3 relative">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          setOpenRowMenu(openRowMenu === row.siteId ? null : row.siteId)
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      <span
                        className={`px-3 py-1 rounded-md text-xs font-medium ${
                          statusColors[st]
                        }`}
                      >
                        {STATUS_LABEL[st]}
                      </span>
                    </div>

                    {openRowMenu === row.siteId && (
                      <div className="absolute mt-2 z-30 bg-default-100 border rounded-md shadow-md w-40">
                        {STATUS_OPTIONS.map((status) => (
                          <div
                            key={status}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-default-200 ${statusColors[status]}`}
                            onClick={() => handleStatusChange(row.siteId, status)}
                          >
                            {STATUS_LABEL[status]}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* ================= SUMMARY ================= */}
                  <td className="p-3">
                    <Button
                      size="icon"
                      variant="outline"
                      title="Download Site Summary"
                      onClick={() => alert(`Download summary for ${row.siteName}`)}
                    >
                      <FileText className="h-4 w-4 text-blue-400" />
                    </Button>
                  </td>
                </tr>
              );
            })}

            {/* ================= TOTAL ROW ================= */}
            {filteredData.length > 0 && (
              <tr className="bg-default-200 font-semibold border-t">
                <td className="p-3">Total</td>
                <td></td>
                <td className="p-3 text-red-600">₹ {totalExpense.toLocaleString()}</td>
                <td className="p-3 text-green-600">₹ {totalReceived.toLocaleString()}</td>
                <td className={`p-3 ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹ {totalProfit.toLocaleString()}
                </td>
                <td></td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
