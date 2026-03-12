/**
 * Export template registry — from V3, adapted to the combined type system.
 *
 * Each template declares its preferred format and provides a data generator.
 * The "custom" template is a pass-through that uses the engine directly with
 * user-supplied settings.
 */

import { Expense, Category } from "@/types/expense";
import { ExportTemplate, TemplateId, ExportFormat } from "@/types/export";
import {
  format,
  parseISO,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  getMonth,
} from "date-fns";

export const TEMPLATES: ExportTemplate[] = [
  {
    id: "tax-report",
    name: "Tax Report",
    description: "Category-grouped summary with subtotals — ready for your accountant",
    icon: "🧾",
    tag: "Finance",
    defaultFormat: "csv",
    defaultFilename: () => `tax-report-${new Date().getFullYear()}`,
    fields: ["Date", "Category", "Amount", "Description", "Category Subtotal"],
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description: "This month's expenses with a running total column",
    icon: "📅",
    tag: "Budgeting",
    defaultFormat: "csv",
    defaultFilename: () => `monthly-summary-${format(new Date(), "yyyy-MM")}`,
    fields: ["Date", "Category", "Amount", "Description", "Running Total"],
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description: "Aggregated stats per category: count, average, % of total",
    icon: "📊",
    tag: "Analytics",
    defaultFormat: "json",
    defaultFilename: () => `category-analysis-${format(new Date(), "yyyy-MM-dd")}`,
    fields: ["Category", "Total", "Count", "Average", "% of Total"],
  },
  {
    id: "full-export",
    name: "Full Export",
    description: "Every field on every expense — ideal for backup or migration",
    icon: "💾",
    tag: "Backup",
    defaultFormat: "json",
    defaultFilename: () => `full-export-${format(new Date(), "yyyy-MM-dd")}`,
    fields: ["ID", "Date", "Category", "Amount", "Description", "Created At"],
  },
  {
    id: "year-in-review",
    name: "Year in Review",
    description: "12-month breakdown by category with monthly totals",
    icon: "🎯",
    tag: "Annual",
    defaultFormat: "csv",
    defaultFilename: () => `year-in-review-${new Date().getFullYear()}`,
    fields: ["Month", "Category", "Total", "Count", "Monthly Total"],
  },
  {
    id: "custom",
    name: "Custom Export",
    description: "Choose your own format, date range, and categories",
    icon: "⚙️",
    tag: "Custom",
    defaultFormat: "csv",
    defaultFilename: () => `expenses-${format(new Date(), "yyyy-MM-dd")}`,
    fields: ["Date", "Category", "Amount", "Description"],
  },
];

export function getTemplate(id: TemplateId): ExportTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}

// ─── Per-template data generators ────────────────────────────────────────────

export function generateTemplateContent(
  templateId: TemplateId,
  expenses: Expense[]
): { content: string; mimeType: string; format: ExportFormat } {
  switch (templateId) {
    case "tax-report":
      return { ...buildTaxReport(expenses), format: "csv" };
    case "monthly-summary":
      return { ...buildMonthlySummary(expenses), format: "csv" };
    case "category-analysis":
      return { ...buildCategoryAnalysis(expenses), format: "json" };
    case "full-export":
      return { ...buildFullExport(expenses), format: "json" };
    case "year-in-review":
      return { ...buildYearInReview(expenses), format: "csv" };
    case "custom":
      // Custom templates use the main engine directly — this path shouldn't
      // be called; the modal dispatches to exportEngine functions instead.
      return { ...buildFullExport(expenses), format: "json" as ExportFormat };
  }
}

// ─── Builders ─────────────────────────────────────────────────────────────────

/** Always double-quotes every field — safest for template outputs. */
function toCsv(rows: string[][]): string {
  return rows
    .map((r) => r.map((c) => `"${sanitizeCell(String(c)).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function sanitizeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function buildTaxReport(expenses: Expense[]): { content: string; mimeType: string } {
  const byCategory = new Map<Category, Expense[]>();
  for (const e of expenses) {
    const arr = byCategory.get(e.category) ?? [];
    arr.push(e);
    byCategory.set(e.category, arr);
  }
  const rows: string[][] = [["Date", "Category", "Amount", "Description", "Category Subtotal"]];
  for (const [cat, items] of Array.from(byCategory.entries())) {
    const subtotal = items.reduce((s, e) => s + e.amount, 0);
    for (const e of items.sort((a, b) => a.date.localeCompare(b.date))) {
      rows.push([e.date, cat, e.amount.toFixed(2), e.description, subtotal.toFixed(2)]);
    }
  }
  return { content: toCsv(rows), mimeType: "text/csv" };
}

function buildMonthlySummary(expenses: Expense[]): { content: string; mimeType: string } {
  const now = new Date();
  const monthly = expenses.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: startOfMonth(now), end: endOfMonth(now) })
  );
  const rows: string[][] = [["Date", "Category", "Amount", "Description", "Running Total"]];
  let running = 0;
  for (const e of [...monthly].sort((a, b) => a.date.localeCompare(b.date))) {
    running += e.amount;
    rows.push([e.date, e.category, e.amount.toFixed(2), e.description, running.toFixed(2)]);
  }
  const total = monthly.reduce((s, e) => s + e.amount, 0);
  rows.push(["", "TOTAL", total.toFixed(2), "", ""]);
  return { content: toCsv(rows), mimeType: "text/csv" };
}

function buildCategoryAnalysis(expenses: Expense[]): { content: string; mimeType: string } {
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const map = new Map<Category, { total: number; count: number }>();
  for (const e of expenses) {
    const prev = map.get(e.category) ?? { total: 0, count: 0 };
    map.set(e.category, { total: prev.total + e.amount, count: prev.count + 1 });
  }
  const data = {
    generated_at: new Date().toISOString(),
    period: "all-time",
    grand_total: parseFloat(grandTotal.toFixed(2)),
    categories: Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, d]) => ({
        category,
        total: parseFloat(d.total.toFixed(2)),
        count: d.count,
        average: parseFloat((d.total / d.count).toFixed(2)),
        percentage_of_total: `${((d.total / grandTotal) * 100).toFixed(1)}%`,
      })),
  };
  return { content: JSON.stringify(data, null, 2), mimeType: "application/json" };
}

function buildFullExport(expenses: Expense[]): { content: string; mimeType: string } {
  const data = {
    exported_at: new Date().toISOString(),
    version: "1.0",
    total_records: expenses.length,
    total_amount: parseFloat(expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
      created_at: e.createdAt,
    })),
  };
  return { content: JSON.stringify(data, null, 2), mimeType: "application/json" };
}

function buildYearInReview(expenses: Expense[]): { content: string; mimeType: string } {
  const now = new Date();
  const yearlyExpenses = expenses.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: startOfYear(now), end: endOfYear(now) })
  );
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const rows: string[][] = [["Month", "Category", "Total", "Count", "Monthly Total"]];

  for (let m = 0; m < 12; m++) {
    const monthExp = yearlyExpenses.filter((e) => getMonth(parseISO(e.date)) === m);
    const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0);
    const catMap = new Map<Category, number>();
    for (const e of monthExp) catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
    const cats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);

    if (cats.length === 0) {
      rows.push([MONTHS[m], "—", "0.00", "0", monthTotal.toFixed(2)]);
    } else {
      cats.forEach(([cat, total], i) => {
        rows.push([
          i === 0 ? MONTHS[m] : "",
          cat,
          total.toFixed(2),
          String(monthExp.filter((e) => e.category === cat).length),
          i === 0 ? monthTotal.toFixed(2) : "",
        ]);
      });
    }
  }
  return { content: toCsv(rows), mimeType: "text/csv" };
}
