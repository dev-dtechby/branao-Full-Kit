import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= CSV ================= */
export const exportToCSV = (data: any[], fileName: string) => {
  const headers = Object.keys(data[0] || {});
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => `"${row[h] ?? ""}"`).join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  downloadBlob(blob, `${fileName}.csv`);
};

/* ================= EXCEL ================= */
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Sites");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF (FINAL FIXED) ================= */
export const exportToPDF = (data: any[], fileName: string) => {
  const doc = new jsPDF("l", "mm", "a4");

  const columns = Object.keys(data[0] || {}).map((key) => ({
    header: key,
    dataKey: key,
  }));

  autoTable(doc, {
    columns,
    body: data,
    styles: {
      fontSize: 8,
      cellWidth: "wrap",
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: "center",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Site Name
      1: { cellWidth: 25 }, // Tender No
      2: { cellWidth: 25 }, // Department
      3: { cellWidth: 25 }, // SD Amount
      4: { cellWidth: 60 }, // SD URL
      5: { cellWidth: 60 }, // Work Order URL
      6: { cellWidth: 70 }, // Tender Docs URL
    },
    margin: { top: 15 },
  });

  doc.save(`${fileName}.pdf`);
};

/* ================= HELPER ================= */
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
