import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type SummaryExportRow = {
  Site: string;
  "Expense Summary": string;
  Amount: number | string;
};

function num(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function formatAmountPDF(v: any) {
  const n = num(v);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

  // ✅ jsPDF default font doesn't support ₹, so use Rs.
  return `Rs. ${formatted}`;
}

/* ================= EXCEL EXPORT ================= */
export const exportSummaryToExcel = (
  data: SummaryExportRow[],
  fileName: string
) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((r) => ({
      Site: r.Site,
      "Expense Summary": r["Expense Summary"],
      Amount: num(r.Amount), // ✅ keep as number in Excel
    }))
  );

  worksheet["!cols"] = [
    { wch: 24 }, // Site
    { wch: 45 }, // Expense Summary
    { wch: 16 }, // Amount
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Site Summary");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF EXPORT (PROPER ALIGNMENT) ================= */
export const exportSummaryToPDF = (
  data: SummaryExportRow[],
  fileName: string,
  opts?: { title?: string }
) => {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape A4

  const title = opts?.title || "Summary Wise Expenses";

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const tableWidth = pageWidth - marginX * 2;

  // ✅ fixed widths for clean alignment on A4 landscape
  const siteW = 55;
  const amtW = 40; // little wider for "Rs. 2,01,500.00"
  const summaryW = tableWidth - siteW - amtW;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(title, marginX, 10);

  autoTable(doc, {
    startY: 14,
    tableWidth,
    margin: { left: marginX, right: marginX },

    head: [["Site", "Expense Summary", "Amount"]],
    body: data.map((row) => [
      row.Site ?? "",
      row["Expense Summary"] ?? "",
      formatAmountPDF(row.Amount),
    ]),

    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "middle",
      halign: "left",
    },

    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "left",
    },

    columnStyles: {
      0: { cellWidth: siteW, halign: "left" },
      1: { cellWidth: summaryW, halign: "left" },
      2: { cellWidth: amtW, halign: "right" }, // ✅ Amount RIGHT aligned
    },

    showHead: "everyPage",

    // ✅ TOTAL row highlight
    didParseCell: (hookData) => {
      if (hookData.section !== "body") return;

      const raw = data[hookData.row.index];
      const isTotal =
        raw?.["Expense Summary"]?.toString().trim().toUpperCase() === "TOTAL";

      if (isTotal) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [245, 245, 245];
      }
    },
  });

  doc.save(`${fileName}.pdf`);
};
