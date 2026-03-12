"use client";

/**
 * Compact history panel — rendered inside the Done step of the modal.
 * Shows the last 5 entries with status, format, and relative timestamp.
 */

import { ExportHistoryEntry } from "@/types/export";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface Props {
  entries: ExportHistoryEntry[];
  onClear: () => void;
}

const FORMAT_BADGE: Record<string, string> = {
  csv:  "bg-green-100 text-green-700",
  json: "bg-blue-100 text-blue-700",
  pdf:  "bg-red-100  text-red-700",
};

export default function ExportHistoryPanel({ entries, onClear }: Props) {
  const recent = entries.slice(0, 6);

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Export History
        </p>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">No history yet.</p>
      ) : (
        <div className="space-y-1.5">
          {recent.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-xs py-1">
              {entry.status === "success" ? (
                <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
              ) : (
                <XCircle size={13} className="text-red-400 flex-shrink-0" />
              )}
              <span className="flex-1 text-gray-700 font-medium truncate">
                {entry.templateName}
              </span>
              <span className={`px-1.5 py-0.5 rounded font-mono font-semibold uppercase text-[10px] ${FORMAT_BADGE[entry.format]}`}>
                {entry.format}
              </span>
              <span className="text-gray-400 whitespace-nowrap">
                {formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
