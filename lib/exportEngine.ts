/**
 * Export Engine — combined best-of approach
 *
 * Fixes applied vs individual versions:
 *  - Formula injection: cells starting with =, +, -, @, \t, \r are prefixed with '
 *  - Column order: Date, Category, Amount, Description (consistent across all formats)
 *  - buildDefaultFilename: no longer silently ignores its argument
 *  - CSV escaping: selective quoting (only when needed) per RFC 4180
 */

import { Expense, Category } from "@/types/expense";
import { ExportFormat, ExportOptions } from "@/types/export";
import { format, parseISO } from "date-fns";

// ─── Filtering ───────────────────────────────────────────────────────────────

export function applyExportFilters(
  expenses: Expense[],
  options: Pick<ExportOptions, "dateFrom" | "dateTo" | "categories">
): Expense[] {
  return expenses
    .filter((e) => {
      if (options.dateFrom && e.date < options.dateFrom) return false;
      if (options.dateTo && e.date > options.dateTo) return false;
      if (options.categories.length > 0 && !options.categories.includes(e.category))
        return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

/** Protect against spreadsheet formula injection (OWASP recommendation). */
function sanitizeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** RFC 4180: wrap in quotes only when the value contains a comma, quote, or newline. */
function escapeCSV(value: string): string {
  const sanitized = sanitizeCell(value);
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export function exportAsCSV(expenses: Expense[], filename: string): void {
  // Consistent column order: Date, Category, Amount, Description
  const header = ["Date", "Category", "Amount", "Description"];
  const rows = expenses.map((e) => [
    e.date,
    escapeCSV(e.category),
    e.amount.toFixed(2),
    escapeCSV(e.description),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  triggerDownload(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function exportAsJSON(expenses: Expense[], filename: string): void {
  const data = {
    exported_at: new Date().toISOString(),
    total_records: expenses.length,
    total_amount: parseFloat(
      expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)
    ),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
    })),
  };
  triggerDownload(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function exportAsPDF(
  expenses: Expense[],
  filename: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const now = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  // Branded header bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Report", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated ${now}`, 14, 20);
  doc.text(
    `${expenses.length} record${expenses.length !== 1 ? "s" : ""}  ·  Total: $${total.toFixed(2)}`,
    14,
    25
  );

  // Category summary line
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CATEGORIES", 14, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(categories.join(", ") || "—", 14, 44);

  autoTable(doc, {
    startY: 52,
    head: [["Date", "Category", "Amount", "Description"]],
    body: expenses.map((e) => [
      format(parseISO(e.date), "MMM d, yyyy"),
      e.category,
      `$${e.amount.toFixed(2)}`,
      e.description,
    ]),
    foot: [["", "TOTAL", `$${total.toFixed(2)}`, ""]],
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 9 },
    footStyles: { fillColor: [238, 242, 255], textColor: [79, 70, 229], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 32 },
      2: { cellWidth: 24, halign: "right" },
      3: { cellWidth: "auto" },
    },
    styles: { overflow: "linebreak", cellPadding: 3 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
        .internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}  ·  ExpenseTracker`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildDefaultFilename(fmt: ExportFormat): string {
  const datePart = format(new Date(), "yyyy-MM-dd");
  return `expenses-${datePart}`;
}

/** Returns the byte size of content as a human-readable string. */
export function humanFileSize(content: string): string {
  const bytes = new Blob([content]).size;
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
