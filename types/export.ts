import { Category } from "./expense";

// ─── Formats ────────────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  dateFrom: string;
  dateTo: string;
  categories: Category[];
}

// ─── Templates ───────────────────────────────────────────────────────────────

export type TemplateId =
  | "tax-report"
  | "monthly-summary"
  | "category-analysis"
  | "full-export"
  | "year-in-review"
  | "custom";

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  tag: string;
  defaultFormat: ExportFormat;
  defaultFilename: (date: string) => string;
  fields: string[];
}

// ─── History ─────────────────────────────────────────────────────────────────

export type HistoryStatus = "success" | "failed";

export interface ExportHistoryEntry {
  id: string;
  timestamp: string;
  templateId: TemplateId;
  templateName: string;
  format: ExportFormat;
  recordCount: number;
  fileSize: string;
  status: HistoryStatus;
  errorMsg?: string;
}

// ─── Persisted preferences ────────────────────────────────────────────────────

export interface ExportPrefs {
  lastTemplateId: TemplateId;
  lastFormat: ExportFormat;
  lastFilename: string;
  lastDateFrom: string;
  lastDateTo: string;
  lastCategories: Category[];
}
