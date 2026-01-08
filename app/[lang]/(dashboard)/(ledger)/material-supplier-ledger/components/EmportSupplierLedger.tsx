// D:\Projects\branao.in\clone\branao-Full-Kit\app\[lang]\(dashboard)\(ledger)\material-supplier-ledger\components\EmportSupplierLedger.tsx

"use client";

import * as XLSX from "xlsx";

type ImportRow = Record<string, any>;

const HEADERS = [
  "DATE",
  "Site",
  "Receipt No",
  "Parchi Photo",
  "OTP",
  "Vehicle No",
  "Vehicle Photo",
  "Material",
  "Size",
  "Qty",
  "Rate",
  "Royalty Qty",
  "Royalty Rate",
  "Royalty Amt",
  "GST",
  "Tax Amt",
  "Total",
  "Payment",
  "Balance",
] as const;

const clean = (v: any) => (v == null ? "" : String(v).trim());

export const importSupplierLedgerExcel = async (file: File): Promise<ImportRow[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];

  // ✅ read as JSON (keys from header row)
  const json: ImportRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // ✅ keep only expected headers and normalize
  const rows = json.map((r) => {
    const out: ImportRow = {};
    HEADERS.forEach((h) => {
      out[h] = clean(r[h]);
    });
    return out;
  });

  // ✅ remove blank rows (no DATE + no Material etc.)
  return rows.filter((r) => clean(r["DATE"]) || clean(r["Material"]) || clean(r["Receipt No"]));
};
