"use client";

/**
 * Standalone export history hook — taken from V3's useExportHub,
 * extracted as a single-responsibility unit.
 *
 * Fixes vs V3:
 *  - Seeded flag: seed data only ever appears once; clearing history does
 *    not re-trigger the seed on the next page load.
 */

import { useState, useEffect, useCallback } from "react";
import { ExportHistoryEntry, TemplateId, ExportFormat } from "@/types/export";

const HISTORY_KEY = "exp-history";
const SEEDED_KEY = "exp-history-seeded";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function makeSeedHistory(): ExportHistoryEntry[] {
  const now = Date.now();
  const seeds: Omit<ExportHistoryEntry, "id">[] = [
    { timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),   templateId: "monthly-summary",   templateName: "Monthly Summary",   format: "csv",  recordCount: 23, fileSize: "4.2 KB",  status: "success" },
    { timestamp: new Date(now - 1000 * 60 * 60 * 27).toISOString(),  templateId: "tax-report",        templateName: "Tax Report",        format: "csv",  recordCount: 87, fileSize: "18.1 KB", status: "success" },
    { timestamp: new Date(now - 1000 * 60 * 60 * 51).toISOString(),  templateId: "full-export",       templateName: "Full Export",       format: "json", recordCount: 87, fileSize: "28.4 KB", status: "success" },
    { timestamp: new Date(now - 1000 * 60 * 60 * 75).toISOString(),  templateId: "category-analysis", templateName: "Category Analysis", format: "json", recordCount: 87, fileSize: "6.1 KB",  status: "success" },
    { timestamp: new Date(now - 1000 * 60 * 60 * 99).toISOString(),  templateId: "year-in-review",    templateName: "Year in Review",    format: "csv",  recordCount: 87, fileSize: "12.3 KB", status: "failed", errorMsg: "Export interrupted" },
    { timestamp: new Date(now - 1000 * 60 * 60 * 123).toISOString(), templateId: "monthly-summary",   templateName: "Monthly Summary",   format: "pdf",  recordCount: 19, fileSize: "142 KB",  status: "success" },
  ];
  return seeds.map((s, i) => ({ ...s, id: `seed-${i}` }));
}

export function useExportHistory() {
  const [entries, setEntries] = useState<ExportHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = load<ExportHistoryEntry[]>(HISTORY_KEY, []);
    const alreadySeeded = load<boolean>(SEEDED_KEY, false);

    if (stored.length === 0 && !alreadySeeded) {
      // First-ever load: populate with realistic seed data
      const seed = makeSeedHistory();
      setEntries(seed);
      save(HISTORY_KEY, seed);
      save(SEEDED_KEY, true);
    } else {
      setEntries(stored);
      // Ensure the seeded flag is set even if entries exist from before the flag
      if (!alreadySeeded) save(SEEDED_KEY, true);
    }
    setIsLoaded(true);
  }, []);

  const addEntry = useCallback(
    (partial: Omit<ExportHistoryEntry, "id" | "timestamp">): ExportHistoryEntry => {
      const entry: ExportHistoryEntry = {
        ...partial,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      setEntries((prev) => {
        const next = [entry, ...prev];
        save(HISTORY_KEY, next);
        return next;
      });
      return entry;
    },
    []
  );

  const clearHistory = useCallback((): void => {
    setEntries([]);
    save(HISTORY_KEY, []);
    // Keep the seeded flag — clearing does NOT re-trigger the seed
  }, []);

  return { entries, isLoaded, addEntry, clearHistory };
}
