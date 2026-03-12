"use client";

// Taken from V2 — no changes needed.

import { useState } from "react";
import { Expense, CATEGORY_BG, CATEGORY_ICONS } from "@/types/expense";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  expenses: Expense[];
}

const PAGE_SIZE = 8;

export default function ExportPreviewTable({ expenses }: Props) {
  const [page, setPage] = useState(0);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const sorted = [...expenses].sort((a, b) =>
    sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  );
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (expenses.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl py-8 text-center text-sm text-gray-400">
        No records match your filters.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600">
                <button
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  onClick={() => { setPage(0); setSortDir((d) => d === "desc" ? "asc" : "desc"); }}
                >
                  Date {sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600">Category</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600">Amount</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                  {format(parseISO(e.date), "MMM d, yyyy")}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BG[e.category]}`}>
                    {CATEGORY_ICONS[e.category]} {e.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                  ${e.amount.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate text-xs">
                  {e.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, expenses.length)} of {expenses.length}
          </span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-2 py-1 rounded border transition-colors ${page === i ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 bg-white hover:bg-gray-100"}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
          </div>
        </div>
      )}
    </div>
  );
}
