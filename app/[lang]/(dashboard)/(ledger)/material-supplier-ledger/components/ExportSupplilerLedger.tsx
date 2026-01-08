import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ExportMeta = {
  supplierName?: string;
  siteName?: string;
  generatedOn?: string; // optional
};

/* ================= EXCEL EXPORT ================= */
export const exportSupplierLedgerToExcel = (
  data: any[],
  fileName: string,
  meta?: ExportMeta
) => {
  const supplierName = meta?.supplierName || "";
  const siteName = meta?.siteName || "";
  const generatedOn =
    meta?.generatedOn || new Date().toLocaleString("en-IN");

  const headers = [
    "DATE",
    "Site",
    "Receipt No",
    "Vehicle No",
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
  ];

  // top meta rows + header + data
  const aoa: any[][] = [
    ["Supplier", supplierName],
    ["Site", siteName],
    ["Generated On", generatedOn],
    [],
    headers,
    ...data.map((r) => headers.map((h) => r[h] ?? "")),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Ledger");

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF EXPORT ================= */
export const exportSupplierLedgerToPDF = (
  data: any[],
  fileName: string,
  meta?: ExportMeta
) => {
  const supplierName = meta?.supplierName || "";
  const siteName = meta?.siteName || "";
  const generatedOn =
    meta?.generatedOn || new Date().toLocaleString("en-IN");

  const doc = new jsPDF("l", "mm", "a4"); // Landscape

  // Title / Meta
  doc.setFontSize(12);
  doc.text("Supplier Ledger", 14, 12);

  doc.setFontSize(9);
  doc.text(`Supplier: ${supplierName || "-"}`, 14, 18);
  doc.text(`Site: ${siteName || "All Sites"}`, 14, 23);
  doc.text(`Generated On: ${generatedOn}`, 14, 28);

  const headers = [
    "DATE",
    "Site",
    "Receipt No",
    "Vehicle No",
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
  ];

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: data.map((r) => headers.map((h) => r[h] ?? "")),
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    margin: { left: 10, right: 10 },
    // ✅ FIX: set proper widths so header doesn't break vertically
    columnStyles: {
      0: { cellWidth: 16 }, // DATE
      1: { cellWidth: 20 }, // Site
      2: { cellWidth: 18 }, // Receipt No
      3: { cellWidth: 22 }, // Vehicle No
      4: { cellWidth: 26 }, // Material
      5: { cellWidth: 12 }, // Size
      6: { cellWidth: 12 }, // Qty
      7: { cellWidth: 12 }, // Rate
      8: { cellWidth: 16 }, // Royalty Qty
      9: { cellWidth: 16 }, // Royalty Rate
      10: { cellWidth: 16 }, // Royalty Amt
      11: { cellWidth: 10 }, // GST
      12: { cellWidth: 14 }, // Tax Amt
      13: { cellWidth: 16 }, // Total
      14: { cellWidth: 16 }, // Payment
      15: { cellWidth: 16 }, // Balance
    },
  });

  doc.save(`${fileName}.pdf`);
};
