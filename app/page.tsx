"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import SummaryCards from "@/components/dashboard/SummaryCards";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import EmptyState from "@/components/dashboard/EmptyState";
import ExportModal from "@/components/export/ExportModal";
import Link from "next/link";
import { PlusCircle, Download } from "lucide-react";

export default function DashboardPage() {
  const { expenses, isLoaded } = useExpenses();
  const [showExport, setShowExport] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your finances…</p>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of your personal finances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm border border-gray-200"
          >
            <Download size={16} />
            Export
          </button>
          <Link
            href="/add"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Add Expense
          </Link>
        </div>
      </div>

      {showExport && (
        <ExportModal expenses={expenses} onClose={() => setShowExport(false)} />
      )}

      {/* Summary cards */}
      <SummaryCards expenses={expenses} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SpendingChart expenses={expenses} />
        </div>
        <div className="lg:col-span-2">
          <CategoryChart expenses={expenses} />
        </div>
      </div>

      {/* Recent expenses */}
      <RecentExpenses expenses={expenses} />
    </div>
  );
}
