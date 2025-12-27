"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadCloud } from "lucide-react";

export default function SiteForm() {
  const [siteName, setSiteName] = useState("");

  return (
    <Card className="p-6 md:p-8 shadow-md border rounded-xl space-y-8">

      {/* ========================================================= */}
      {/*                       TITLE                               */}
      {/* ========================================================= */}
      <h2 className="text-2xl font-semibold text-default-900">
        Create New Site
      </h2>


      {/* ========================================================= */}
      {/*                SITE + TENDER + DEPARTMENT                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Site Name */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Site Name</Label>
          <Input placeholder="Enter site name" />
        </div>

        {/* Tender No */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Tender No</Label>
          <Input placeholder="Tender number" />
        </div>

        {/* Department */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Department</Label>
          <select className="w-full border rounded-md px-3 py-2 bg-background">
            <option>Select Department</option>
            <option>Water Resource</option>
            <option>PHED</option>
            <option>Municipal</option>
          </select>
        </div>

      </div>




      {/* ========================================================= */}
      {/*                     SD AMOUNT + WORK ORDER                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* SD Amount */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">SD Amount</Label>
          <Input placeholder="Enter SD amount" />
        </div>

        {/* Upload SD */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Upload SD</Label>
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            <span className="text-sm">Upload File</span>
          </div>
        </div>

        {/* Upload Work Order */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Upload Work Order</Label>
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            <span className="text-sm">Upload File</span>
          </div>
        </div>

      </div>



      {/* ========================================================= */}
      {/*             UPLOAD TENDER DOCUMENTS SECTION               */}
      {/* ========================================================= */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">All Tender Documents Upload</Label>
        <div className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
          <UploadCloud className="h-4 w-4" />
          <span className="text-sm">Upload All Documents</span>
        </div>
      </div>




      {/* ========================================================= */}
      {/*                        ESTIMATE                           */}
      {/* ========================================================= */}
      <h3 className="text-xl font-semibold text-default-800">Estimate</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ------------------ Concrete Table ------------------ */}
        <Card className="p-4 border rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4 text-default-900">
            Concrete
          </h4>

          <ScrollArea className="h-auto">
            <table className="w-full text-sm border-collapse">
              <tbody className="divide-y">

                {["Cement", "Metal", "Sand", "Labour", "Royalty", "Over Head"].map(
                  (item) => (
                    <tr key={item} className="hover:bg-default-50">
                      <td className="p-3 font-medium">{item}</td>
                      <td className="p-3">
                        <Input placeholder="Amount" />
                      </td>
                    </tr>
                  )
                )}

              </tbody>
            </table>
          </ScrollArea>
        </Card>



        {/* -------------------- CNS Table -------------------- */}
        <Card className="p-4 border rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4 text-default-900">
            CNS
          </h4>

          <ScrollArea className="h-auto">
            <table className="w-full text-sm border-collapse">
              <tbody className="divide-y">

                {["Lead", "Dressing", "Water & Compaction", "Loading"].map(
                  (item) => (
                    <tr key={item} className="hover:bg-default-50">
                      <td className="p-3 font-medium">{item}</td>
                      <td className="p-3">
                        <Input placeholder="Amount" />
                      </td>
                    </tr>
                  )
                )}

              </tbody>
            </table>
          </ScrollArea>
        </Card>

      </div>



      {/* ========================================================= */}
      {/*                        BUTTONS                           */}
      {/* ========================================================= */}
      <div className="flex flex-wrap gap-4 justify-center pt-4">

        <Button className="px-10">Save</Button>

        <Button variant="outline" className="px-10">
          Update
        </Button>

        <Button variant="outline" className="px-10">
          Reset
        </Button>

      </div>
    </Card>
  );
}
