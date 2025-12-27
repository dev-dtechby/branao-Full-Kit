"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Download, Edit, Trash2 } from "lucide-react";

export default function SiteSummaryCards() {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("");

  // Dummy site list
  const siteList = ["Dev Site", "Kondagaon Site", "Rasani Site"];

  // Dummy summary data
  const summaryData = [
    { site: "Dev Site", summary: "Petrol", amount: 450 },
    { site: "Dev Site", summary: "Transport", amount: 800 },
    { site: "Kondagaon Site", summary: "Labour", amount: 2500 },
  ];

  // Filter logic
  const filtered = summaryData.filter((v) => {
    const matchSite = selectedSite ? v.site === selectedSite : true;
    const matchSearch = v.summary.toLowerCase().includes(search.toLowerCase());
    return matchSite && matchSearch;
  });

  // Total Amount
  const totalAmount = filtered.reduce((sum, v) => sum + v.amount, 0);

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      {/* ---------------- TOP FILTER BAR ---------------- */}
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-3 items-center">

          {/* ------- Left Title ------- */}
          <CardTitle className="text-xl font-semibold text-default-900">
            Summary Wise Expenses
          </CardTitle>

          {/* ------- Right Filter Controls ------- */}
          <div className="flex items-center gap-3 w-full md:w-auto">

            {/* Search */}
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-56"
            />

            {/* Select Site */}
            <select
              className="border bg-background px-3 py-2 rounded-md text-sm md:w-44"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="">Select Site</option>
              {siteList.map((site, i) => (
                <option key={i} value={site}>
                  {site}
                </option>
              ))}
            </select>

            {/* Add Summary Entry */}
            <Button className="flex items-center gap-2 bg-primary text-white">
              <Plus className="h-4 w-4" />
              Add Summary Entry
            </Button>

            {/* Export Button */}
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* ---------------- DATA TABLE ---------------- */}
      <CardContent>
        <ScrollArea className="w-full overflow-auto rounded-md border">
          <table className="min-w-[700px] w-full table-auto border-collapse">
            <thead className="bg-default-100 text-default-700">
              <tr>
                <th className="p-3 text-left">Exp. Summary</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-default-50 transition text-default-700"
                >
                  <td className="p-3 font-medium">{row.summary}</td>

                  <td className="p-3 font-semibold text-default-900">
                    ₹ {row.amount.toLocaleString()}
                  </td>

                  <td className="p-3 flex gap-2">
                    <Button size="icon" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="soft">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr className="bg-default-200 border-t font-semibold">
                <td className="p-3">Total</td>

                <td className="p-3 text-default-900">
                  ₹ {totalAmount.toLocaleString()}
                </td>

                <td></td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
