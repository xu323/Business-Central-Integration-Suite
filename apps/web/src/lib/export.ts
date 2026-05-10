/**
 * CSV / XLSX / PDF export helpers used by DataTable.
 */
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCsv<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCsvField(String(c.accessor(row) ?? "")))
        .join(","),
    )
    .join("\n");
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + header + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function exportXlsx<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Sheet1",
): void {
  const data = rows.map((row) => {
    const obj: Record<string, string | number | null | undefined> = {};
    for (const c of columns) {
      obj[c.header] = c.accessor(row);
    }
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  options: { title?: string; subtitle?: string } = {},
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  if (options.title) {
    doc.setFontSize(14);
    doc.text(options.title, 40, 36);
  }
  if (options.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(options.subtitle, 40, 50);
    doc.setTextColor(0);
  }
  autoTable(doc, {
    startY: options.title ? 64 : 40,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.accessor(row) ?? ""))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [0, 120, 212], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [243, 242, 241] },
  });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
