"use client";

/**
 * Persists the user's last-used export settings across modal sessions.
 * Solves V2's "resets to defaults every time you reopen" problem.
 */

import { useState, useEffect, useCallback } from "react";
import { ExportPrefs, TemplateId, ExportFormat } from "@/types/export";
import { Category } from "@/types/expense";
import { format } from "date-fns";

const PREFS_KEY = "exp-prefs";

const DEFAULT_PREFS: ExportPrefs = {
  lastTemplateId: "custom",
  lastFormat: "csv",
  lastFilename: `expenses-${format(new Date(), "yyyy-MM-dd")}`,
  lastDateFrom: "",
  lastDateTo: "",
  lastCategories: [],
};

function load(): ExportPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function save(prefs: ExportPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export function useExportPrefs() {
  const [prefs, setPrefs] = useState<ExportPrefs>(DEFAULT_PREFS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPrefs(load());
    setIsLoaded(true);
  }, []);

  const updatePrefs = useCallback((patch: Partial<ExportPrefs>): void => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  return { prefs, isLoaded, updatePrefs };
}
