"use client";

/**
 * Combined Export Modal — best-of all three versions:
 *
 *  V3 template step   → first screen lets you pick a purpose-built template
 *                        (or Custom) which pre-fills format & filename
 *  V2 configure step  → date range + category pills + format cards + filename
 *  V2 preview step    → paginated sortable table + category breakdown
 *  V3 history tracking → every successful/failed export is recorded to localStorage
 *  NEW prefs persistence → last-used template, format, filters are restored on re-open
 *  ENGINE fixes        → formula injection protection, consistent column order
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Download, FileText, FileJson, File,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Expense, Category, CATEGORIES, CATEGORY_ICONS } from "@/types/expense";
import { ExportFormat, TemplateId } from "@/types/export";
import {
  applyExportFilters, exportAsCSV, exportAsJSON, exportAsPDF,
  humanFileSize, buildDefaultFilename,
} from "@/lib/exportEngine";
import { TEMPLATES, getTemplate, generateTemplateContent } from "@/lib/exportTemplates";
import { triggerDownload } from "@/lib/exportEngine";
import { useExportHistory } from "@/hooks/useExportHistory";
import { useExportPrefs } from "@/hooks/useExportPrefs";
import { format } from "date-fns";
import ExportPreviewTable from "./ExportPreviewTable";
import ExportHistoryPanel from "./ExportHistoryPanel";

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

type Step = "template" | "configure" | "preview" | "done";
type ExportStatus = "idle" | "loading" | "success" | "error";

const FORMAT_OPTIONS: { id: ExportFormat; label: string; description: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "csv",  label: "CSV",        description: "Spreadsheet-compatible, works with Excel & Google Sheets", icon: <FileText size={18} /> },
  { id: "json", label: "JSON",       description: "Structured data with metadata, ideal for developers",      icon: <FileJson size={18} /> },
  { id: "pdf",  label: "PDF Report", description: "Branded A4 report with header, table, and totals",         icon: <File    size={18} />, badge: "Pro" },
];

const STEP_LABELS: Record<Step, string> = {
  template:  "Template",
  configure: "Configure",
  preview:   "Preview",
  done:      "Done",
};

export default function ExportModal({ expenses, onClose }: Props) {
  const { entries: historyEntries, addEntry, clearHistory } = useExportHistory();
  const { prefs, isLoaded: prefsLoaded, updatePrefs } = useExportPrefs();

  // ── Step & export status ──────────────────────────────────────────────────
  const [step, setStep]               = useState<Step>("template");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [errorMsg, setErrorMsg]       = useState("");

  // ── Form state (seeded from persisted prefs once loaded) ──────────────────
  const [templateId,          setTemplateId]          = useState<TemplateId>("custom");
  const [selectedFormat,      setSelectedFormat]      = useState<ExportFormat>("csv");
  const [filename,            setFilename]            = useState(buildDefaultFilename("csv"));
  const [dateFrom,            setDateFrom]            = useState("");
  const [dateTo,              setDateTo]              = useState("");
  const [selectedCategories,  setSelectedCategories]  = useState<Category[]>([]);

  // Restore persisted prefs once loaded
  useEffect(() => {
    if (!prefsLoaded) return;
    setTemplateId(prefs.lastTemplateId);
    setSelectedFormat(prefs.lastFormat);
    setFilename(prefs.lastFilename);
    setDateFrom(prefs.lastDateFrom);
    setDateTo(prefs.lastDateTo);
    setSelectedCategories(prefs.lastCategories);
  }, [prefsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard & scroll lock ────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // ── Filtered expenses ─────────────────────────────────────────────────────
  const filteredExpenses = useMemo(
    () => applyExportFilters(expenses, { dateFrom, dateTo, categories: selectedCategories }),
    [expenses, dateFrom, dateTo, selectedCategories]
  );

  const totalAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<Category, number>();
    for (const e of filteredExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // ── Template selection ────────────────────────────────────────────────────
  function handleSelectTemplate(id: TemplateId) {
    const tpl = getTemplate(id);
    setTemplateId(id);
    if (id !== "custom") {
      setSelectedFormat(tpl.defaultFormat);
      setFilename(tpl.defaultFilename(format(new Date(), "yyyy-MM-dd")));
    }
    updatePrefs({ lastTemplateId: id, lastFormat: tpl.defaultFormat });
  }

  // ── Category toggle ───────────────────────────────────────────────────────
  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      updatePrefs({ lastCategories: next });
      return next;
    });
  }

  function handleFormatChange(fmt: ExportFormat) {
    setSelectedFormat(fmt);
    updatePrefs({ lastFormat: fmt });
  }

  function handleFilenameChange(val: string) {
    setFilename(val);
    updatePrefs({ lastFilename: val });
  }

  function handleDateFromChange(val: string) {
    setDateFrom(val);
    updatePrefs({ lastDateFrom: val });
  }

  function handleDateToChange(val: string) {
    setDateTo(val);
    updatePrefs({ lastDateTo: val });
  }

  // ── Export execution ──────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExportStatus("loading");
    setErrorMsg("");
    const tpl = getTemplate(templateId);
    const name = filename.trim() || buildDefaultFilename(selectedFormat);

    try {
      await new Promise((r) => setTimeout(r, 500)); // make loading state visible

      let content = "";
      let mimeType = "text/csv";
      let effectiveFormat = selectedFormat;

      if (templateId !== "custom") {
        const result = generateTemplateContent(templateId, filteredExpenses);
        content = result.content;
        mimeType = result.mimeType;
        effectiveFormat = result.format;
        triggerDownload(content, `${name}.${effectiveFormat}`, mimeType);
      } else {
        if (selectedFormat === "csv") {
          exportAsCSV(filteredExpenses, name);
          content = "csv-content"; // placeholder for size calc
          mimeType = "text/csv";
        } else if (selectedFormat === "json") {
          exportAsJSON(filteredExpenses, name);
          content = JSON.stringify(filteredExpenses);
          mimeType = "application/json";
        } else {
          await exportAsPDF(filteredExpenses, name);
          content = "pdf-content";
          mimeType = "application/pdf";
        }
      }

      addEntry({
        templateId,
        templateName: tpl.name,
        format: effectiveFormat,
        recordCount: filteredExpenses.length,
        fileSize: content.length > 12 ? humanFileSize(content) : "—",
        status: "success",
      });

      setExportStatus("success");
      setStep("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed. Please try again.";
      setErrorMsg(msg);
      setExportStatus("error");

      addEntry({
        templateId,
        templateName: tpl.name,
        format: selectedFormat,
        recordCount: filteredExpenses.length,
        fileSize: "—",
        status: "failed",
        errorMsg: msg,
      });
    }
  }, [templateId, filename, selectedFormat, filteredExpenses, addEntry]);

  // ── Step indicator (only for non-done steps) ──────────────────────────────
  const STEPS: Step[] = ["template", "configure", "preview"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      <div className="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden ring-1 ring-teal-500/20">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <Download size={18} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export Data</h2>
              <p className="text-xs text-slate-400">
                {step === "template"  && "Choose an export template"}
                {step === "configure" && "Refine filters and format"}
                {step === "preview"   && `${filteredExpenses.length} records ready`}
                {step === "done"      && "Export complete"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Step indicator ── */}
        {step !== "done" && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 flex-shrink-0">
            {STEPS.map((s, i) => {
              const past = STEPS.indexOf(step) > i;
              const active = step === s;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className="w-6 h-px bg-slate-500" />}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${active ? "bg-teal-500 text-white" : past ? "bg-teal-400 text-white" : "bg-slate-500 text-slate-300"}`}>
                      {past ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-white" : "text-slate-400"}`}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1: Template ── */}
          {step === "template" && (
            <div className="p-6 space-y-3">
              {TEMPLATES.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${selected ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <span className="text-2xl mt-0.5 flex-shrink-0">{tpl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${selected ? "text-teal-800" : "text-gray-900"}`}>
                          {tpl.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                          {tpl.tag}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${selected ? "bg-teal-200 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                          .{tpl.defaultFormat}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tpl.description}</p>
                      {/* Field preview chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tpl.fields.map((f) => (
                          <span key={f} className="text-[10px] px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-gray-400 font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selected && (
                      <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── STEP 2: Configure ── */}
          {step === "configure" && (
            <div className="p-6 space-y-5">

              {/* Format cards — shown only for Custom; templates fix the format */}
              {templateId === "custom" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Export Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    {FORMAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleFormatChange(opt.id)}
                        className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 text-left transition-all ${selectedFormat === opt.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                      >
                        {opt.badge && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                        <span className={selectedFormat === opt.id ? "text-teal-600" : "text-gray-400"}>
                          {opt.icon}
                        </span>
                        <span className="font-semibold text-sm text-gray-900">{opt.label}</span>
                        <span className="text-xs text-gray-500 leading-snug">{opt.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Format indicator for named templates */}
              {templateId !== "custom" && (
                <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
                  <span className="text-xl">{getTemplate(templateId).icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-teal-900">{getTemplate(templateId).name}</p>
                    <p className="text-xs text-teal-600">
                      Format fixed to <span className="font-mono font-bold uppercase">.{getTemplate(templateId).defaultFormat}</span> for this template
                    </p>
                  </div>
                </div>
              )}

              {/* Filename */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Filename</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => handleFilenameChange(e.target.value)}
                    placeholder="expenses-export"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                  <span className="text-sm text-gray-400 font-mono flex-shrink-0">
                    .{templateId !== "custom" ? getTemplate(templateId).defaultFormat : selectedFormat}
                  </span>
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date Range <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">From</p>
                    <input type="date" value={dateFrom} onChange={(e) => handleDateFromChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">To</p>
                    <input type="date" value={dateTo} onChange={(e) => handleDateToChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition" />
                  </div>
                </div>
              </div>

              {/* Category filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Categories <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  {selectedCategories.length > 0 && (
                    <button onClick={() => { setSelectedCategories([]); updatePrefs({ lastCategories: [] }); }}
                      className="text-xs text-teal-600 hover:underline font-medium">
                      Select all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selectedCategories.length === 0
                          ? "border-teal-200 bg-teal-50 text-teal-700"
                          : selectedCategories.includes(cat)
                          ? "border-teal-400 bg-teal-100 text-teal-800"
                          : "border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      <span>{CATEGORY_ICONS[cat]}</span>{cat}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {selectedCategories.length === 0
                    ? "All categories included"
                    : `${selectedCategories.length} of ${CATEGORIES.length} selected`}
                </p>
              </div>

              {/* Live summary */}
              <div className={`rounded-xl p-4 flex items-center justify-between border ${filteredExpenses.length === 0 ? "bg-amber-50 border-amber-100" : "bg-teal-50 border-teal-100"}`}>
                <div>
                  <p className={`text-sm font-semibold ${filteredExpenses.length === 0 ? "text-amber-900" : "text-teal-900"}`}>
                    {filteredExpenses.length} record{filteredExpenses.length !== 1 ? "s" : ""} will be exported
                  </p>
                  <p className={`text-xs mt-0.5 ${filteredExpenses.length === 0 ? "text-amber-600" : "text-teal-600"}`}>
                    Total: ${totalAmount.toFixed(2)}
                  </p>
                </div>
                {filteredExpenses.length === 0
                  ? <AlertCircle size={20} className="text-amber-500" />
                  : <CheckCircle2 size={20} className="text-teal-500" />}
              </div>
            </div>
          )}

          {/* ── STEP 3: Preview ── */}
          {step === "preview" && (
            <div className="p-6 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Records", value: filteredExpenses.length, cls: "text-gray-900" },
                  { label: "Total",   value: `$${totalAmount.toFixed(0)}`, cls: "text-teal-600" },
                  { label: "Categories", value: categoryBreakdown.length, cls: "text-gray-900" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Category breakdown mini-bars */}
              {categoryBreakdown.length > 0 && (
                <div className="space-y-1.5">
                  {categoryBreakdown.map(([cat, amt]) => (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                      <span className="w-4">{CATEGORY_ICONS[cat]}</span>
                      <span className="w-24 text-gray-600 font-medium truncate">{cat}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${(amt / totalAmount) * 100}%` }} />
                      </div>
                      <span className="text-gray-500 w-14 text-right">${amt.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* File badge */}
              <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-700">File:</span>
                <span className="font-mono text-gray-600 truncate">
                  {(filename.trim() || buildDefaultFilename(selectedFormat))}.{templateId !== "custom" ? getTemplate(templateId).defaultFormat : selectedFormat}
                </span>
                <span className="ml-auto font-bold text-teal-600 uppercase tracking-wide font-mono">
                  {templateId !== "custom" ? getTemplate(templateId).defaultFormat : selectedFormat}
                </span>
              </div>

              <ExportPreviewTable expenses={filteredExpenses} />

              {/* Error message */}
              {exportStatus === "error" && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === "done" && (
            <div className="p-6">
              <div className="flex flex-col items-center text-center gap-3 py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={30} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Export Complete!</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredExpenses.length} record{filteredExpenses.length !== 1 ? "s" : ""} exported as{" "}
                    <span className="font-semibold text-gray-700 uppercase">
                      {templateId !== "custom" ? getTemplate(templateId).defaultFormat : selectedFormat}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {(filename.trim() || buildDefaultFilename(selectedFormat))}.{templateId !== "custom" ? getTemplate(templateId).defaultFormat : selectedFormat}
                  </p>
                </div>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => { setStep("template"); setExportStatus("idle"); }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Export Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>

              <ExportHistoryPanel entries={historyEntries} onClear={clearHistory} />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== "done" && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-800 flex-shrink-0">
            <button
              onClick={() => {
                if (step === "template") onClose();
                else if (step === "configure") setStep("template");
                else if (step === "preview") setStep("configure");
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm font-medium transition-colors"
            >
              <ChevronLeft size={15} />
              {step === "template" ? "Cancel" : "Back"}
            </button>

            {step === "template" && (
              <button
                onClick={() => setStep("configure")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
              >
                Configure <ChevronRight size={15} />
              </button>
            )}

            {step === "configure" && (
              <button
                onClick={() => setStep("preview")}
                disabled={filteredExpenses.length === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                Preview <ChevronRight size={15} />
              </button>
            )}

            {step === "preview" && (
              <button
                onClick={handleExport}
                disabled={exportStatus === "loading" || filteredExpenses.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors min-w-[148px] justify-center"
              >
                {exportStatus === "loading" ? (
                  <><Loader2 size={15} className="animate-spin" /> Exporting…</>
                ) : (
                  <><Download size={15} /> Download</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
