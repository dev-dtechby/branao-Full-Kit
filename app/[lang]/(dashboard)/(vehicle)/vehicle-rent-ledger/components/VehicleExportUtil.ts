"use client";

/**
 * Vehicle Export Utility
 * - PDF: jsPDF + autoTable (DATA MODE) => no encoding issues
 * - Excel: xlsx
 *
 * PDF NOTE:
 * - Avoid ₹ in jsPDF default fonts. Use "Rs." for clean output.
 * - Column widths compressed so ALL columns fit in A4 landscape.
 */

export type VehicleRentExportRow = {
  date: string;
  owner: string;
  site: string;
  vehicleNo: string;
  vehicleName: string;
  vehicleType: string;
  vehicleRate: string;
  start: number;
  end: number;
  workingHr: number;
  dieselExp: number;
  generated: number;
  payment: number;
  balance: number;
  remark: string;
};

export type VehicleRentExportMeta = {
  title: string;
  ownerLedgerName: string;
  ownerContact: string;
  ownerAddress: string;

  vehicleLabel: string;
  vehicleTypeLabel: string;
  vehicleRateText: string;

  siteLabel: string;
  generatedOn: string;
};

const cleanText = (v: any) => {
  const s = String(v ?? "");
  const decoded = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return decoded.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const fmt2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");
const rs = (n: number) => `Rs. ${fmt2(n)}`;

export async function exportVehicleRentPDF(meta: VehicleRentExportMeta, rows: VehicleRentExportRow[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  // Landscape A4
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const m = {
    title: cleanText(meta?.title || "Vehicle Rent Ledger"),
    ownerLedgerName: cleanText(meta?.ownerLedgerName || "All Owners"),
    ownerContact: cleanText(meta?.ownerContact || "-"),
    ownerAddress: cleanText(meta?.ownerAddress || "-"),
    vehicleLabel: cleanText(meta?.vehicleLabel || "All Vehicles"),
    vehicleTypeLabel: cleanText(meta?.vehicleTypeLabel || "Multiple"),
    vehicleRateText: cleanText(meta?.vehicleRateText || "-"),
    siteLabel: cleanText(meta?.siteLabel || "All Sites"),
    generatedOn: cleanText(meta?.generatedOn || new Date().toLocaleString()),
  };

  const pageW = doc.internal.pageSize.getWidth();
  let y = 40;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(m.title, 28, y);
  y += 18;

  // Meta (2 columns)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const leftLines = [
    `Owner Ledger: ${m.ownerLedgerName}`,
    `Owner Mobile: ${m.ownerContact || "-"}`,
    `Owner Address: ${m.ownerAddress || "-"}`,
    `Site: ${m.siteLabel}`,
  ];

  const rightLines = [
    `Vehicle: ${m.vehicleLabel}`,
    `Vehicle Type: ${m.vehicleTypeLabel}`,
    `Vehicle Rate: ${m.vehicleRateText}`,
    `Generated On: ${m.generatedOn}`,
  ];

  const leftX = 28;
  const rightX = Math.max(pageW / 2 + 10, 420);

  leftLines.forEach((ln, i) => doc.text(ln, leftX, y + i * 14));
  rightLines.forEach((ln, i) => doc.text(ln, rightX, y + i * 14));

  y += Math.max(leftLines.length, rightLines.length) * 14 + 16;

  // Table head/body (DATA MODE)
  const head = [
    [
      "Date",
      "Owner",
      "Site",
      "Vehicle",
      "Type/Rate",
      "Start",
      "End",
      "WorkHr",
      "Diesel",
      "Generated",
      "Payment",
      "Balance",
      "Remark",
    ],
  ];

  const body = rows.map((r) => {
    const vehicleText = `${cleanText(r.vehicleNo)}${r.vehicleName ? " — " + cleanText(r.vehicleName) : ""}`;
    const typeRateText = `${cleanText(r.vehicleType)} • ${cleanText(r.vehicleRate)}`;

    return [
      cleanText(r.date),
      cleanText(r.owner),
      cleanText(r.site),
      vehicleText,
      typeRateText,
      fmt2(r.start),
      fmt2(r.end),
      fmt2(r.workingHr),
      rs(r.dieselExp),
      rs(r.generated),
      rs(r.payment),
      rs(r.balance),
      cleanText(r.remark || ""),
    ];
  });

  const totals = rows.reduce(
    (a, r) => {
      a.diesel += Number(r.dieselExp || 0);
      a.generated += Number(r.generated || 0);
      a.payment += Number(r.payment || 0);
      a.balance += Number(r.balance || 0);
      return a;
    },
    { diesel: 0, generated: 0, payment: 0, balance: 0 }
  );

  body.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    rs(totals.diesel),
    rs(totals.generated),
    rs(totals.payment),
    rs(totals.balance),
    "",
  ]);

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",

    // ✅ tighter style so columns don't cut
    styles: {
      font: "helvetica",
      fontSize: 8,          // ↓ smaller font
      cellPadding: 4,       // ↓ smaller padding
      valign: "middle",
      overflow: "linebreak",
      lineColor: [220, 226, 235],
      lineWidth: 0.6,
    },

    headStyles: {
      fillColor: [24, 33, 53], // navy
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },

    alternateRowStyles: { fillColor: [245, 247, 250] },

    // ✅ compressed column widths (A4 landscape fit)
    columnStyles: {
      0: { cellWidth: 55 },                 // Date
      1: { cellWidth: 75 },                 // Owner
      2: { cellWidth: 60 },                 // Site
      3: { cellWidth: 95 },                 // Vehicle
      4: { cellWidth: 115 },                // Type/Rate
      5: { cellWidth: 45, halign: "right" },// Start
      6: { cellWidth: 45, halign: "right" },// End
      7: { cellWidth: 45, halign: "right" },// WorkHr
      8: { cellWidth: 60, halign: "right" },// Diesel
      9: { cellWidth: 65, halign: "right" },// Generated
      10:{ cellWidth: 60, halign: "right" },// Payment
      11:{ cellWidth: 60, halign: "right" },// Balance
      12:{ cellWidth: 95 },                 // Remark
    },

    didParseCell: (data) => {
      const isTotalRow = data.section === "body" && data.row.index === body.length - 1;
      if (isTotalRow) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [235, 239, 245];
      }

      // Balance red/green (not for total row)
      if (data.section === "body" && data.column.index === 11 && data.row.index < body.length - 1) {
        const raw = rows[data.row.index]?.balance ?? 0;
        if (Number(raw) > 0) data.cell.styles.textColor = [220, 38, 38];
        else data.cell.styles.textColor = [22, 163, 74];
      }
    },

    // ✅ reduce margins
    margin: { left: 28, right: 28 },
  });

  const filename = `Vehicle_Rent_Ledger_${todayYMD()}.pdf`;
  doc.save(filename);
}

export async function exportVehicleRentExcel(meta: VehicleRentExportMeta, rows: VehicleRentExportRow[]) {
  const XLSX = await import("xlsx");

  const m = {
    title: cleanText(meta?.title || "Vehicle Rent Ledger"),
    ownerLedgerName: cleanText(meta?.ownerLedgerName || "All Owners"),
    ownerContact: cleanText(meta?.ownerContact || "-"),
    ownerAddress: cleanText(meta?.ownerAddress || "-"),
    vehicleLabel: cleanText(meta?.vehicleLabel || "All Vehicles"),
    vehicleTypeLabel: cleanText(meta?.vehicleTypeLabel || "Multiple"),
    vehicleRateText: cleanText(meta?.vehicleRateText || "-"),
    siteLabel: cleanText(meta?.siteLabel || "All Sites"),
    generatedOn: cleanText(meta?.generatedOn || new Date().toLocaleString()),
  };

  const aoa: any[][] = [];
  aoa.push([m.title]);
  aoa.push([`Owner Ledger: ${m.ownerLedgerName}`]);
  aoa.push([`Owner Mobile: ${m.ownerContact}`]);
  aoa.push([`Owner Address: ${m.ownerAddress}`]);
  aoa.push([`Vehicle: ${m.vehicleLabel}`]);
  aoa.push([`Vehicle Type: ${m.vehicleTypeLabel}`]);
  aoa.push([`Vehicle Rate: ${m.vehicleRateText}`]);
  aoa.push([`Site: ${m.siteLabel}`]);
  aoa.push([`Generated On: ${m.generatedOn}`]);
  aoa.push([]);

  aoa.push([
    "Date",
    "Owner",
    "Site",
    "VehicleNo",
    "VehicleName",
    "VehicleType",
    "VehicleRate",
    "Start",
    "End",
    "WorkingHr",
    "DieselExp",
    "Generated",
    "Payment",
    "Balance",
    "Remark",
  ]);

  for (const r of rows) {
    aoa.push([
      cleanText(r.date),
      cleanText(r.owner),
      cleanText(r.site),
      cleanText(r.vehicleNo),
      cleanText(r.vehicleName),
      cleanText(r.vehicleType),
      cleanText(r.vehicleRate),
      Number(r.start || 0),
      Number(r.end || 0),
      Number(r.workingHr || 0),
      Number(r.dieselExp || 0),
      Number(r.generated || 0),
      Number(r.payment || 0),
      Number(r.balance || 0),
      cleanText(r.remark || ""),
    ]);
  }

  const totals = rows.reduce(
    (a, r) => {
      a.diesel += Number(r.dieselExp || 0);
      a.generated += Number(r.generated || 0);
      a.payment += Number(r.payment || 0);
      a.balance += Number(r.balance || 0);
      return a;
    },
    { diesel: 0, generated: 0, payment: 0, balance: 0 }
  );

  aoa.push([]);
  aoa.push(["TOTAL", "", "", "", "", "", "", "", "", "", totals.diesel, totals.generated, totals.payment, totals.balance, ""]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 18 },
    { wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 28 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "VehicleRentLedger");

  const filename = `Vehicle_Rent_Ledger_${todayYMD()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
