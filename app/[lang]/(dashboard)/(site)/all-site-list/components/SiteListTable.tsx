"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// ICONS
import { Eye, Download, Pencil, Trash2 } from "lucide-react";

export default function SiteListTable() {
  const [search, setSearch] = useState("");

  // Sample (Later DB se aayega)
  const siteData = [
    {
      siteName: "Dev Site",
      tenderNo: "TN001",
      department: "PWD",
      workOrderNo: "WO-889",
      sdAmt: "₹ 25,000",
      sdFile: "sdfile.pdf",
      workOrderFile: "wofile.pdf",
      tenderZip: "tender.zip",
      tenderDocs: "tender_docs.pdf",
    },
  ];

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      {/* HEADER */}
      <CardHeader>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <CardTitle className="text-xl font-semibold text-default-900">
            All Site List
          </CardTitle>

          {/* Search + Export */}
          <div className="flex w-full md:w-auto gap-2">
            <Input
              placeholder="Search Site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-64"
            />

            <Button className="px-5">Export</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Responsive Scrollable Table */}
        <ScrollArea className="w-full overflow-auto rounded-md border">
          <table className="min-w-[1200px] w-full table-auto border-collapse">
            <thead className="bg-default-100 text-default-700 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left">Site Name</th>
                <th className="p-3 text-left">Tender No</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Work Order No</th>
                <th className="p-3 text-left">SD Amount</th>
                <th className="p-3 text-left">SD</th>
                <th className="p-3 text-left">Work Order</th>
                <th className="p-3 text-left">All Docs (zip)</th>
                <th className="p-3 text-left">Tender Docs</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {siteData.map((row, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-default-50 transition text-default-700"
                >
                  <td className="p-3">{row.siteName}</td>
                  <td className="p-3">{row.tenderNo}</td>
                  <td className="p-3">{row.department}</td>
                  <td className="p-3">{row.workOrderNo}</td>
                  <td className="p-3">{row.sdAmt}</td>

                  {/* SD file */}
                  <td className="p-3">
                    <Button size="icon" variant="outline" className="p-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>

                  {/* Work order file */}
                  <td className="p-3">
                    <Button size="icon" variant="outline" className="p-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>

                  {/* ZIP */}
                  <td className="p-3">
                    <Button size="icon" variant="outline" className="p-2">
                      <Download className="h-4 w-4 text-blue-600" />
                    </Button>
                  </td>

                  {/* Tender docs */}
                  <td className="p-3">
                    <Button size="icon" variant="outline" className="p-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>

                  {/* Actions */}
                  <td className="p-3 flex gap-2">
                    <Button size="icon" variant="outline" className="p-2">
                      <Pencil className="h-4 w-4 text-yellow-600" />
                    </Button>

                    <Button size="icon" variant="outline" className="p-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}

              {/* No data */}
              {siteData.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-default-500">
                    No site records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
