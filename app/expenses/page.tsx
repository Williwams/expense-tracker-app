"use client";

import { useExpenses } from "@/hooks/useExpenses";
import ExpenseList from "@/components/expenses/ExpenseList";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function ExpensesPage() {
  const { expenses, isLoaded, deleteExpense, updateExpense, exportCSV } =
    useExpenses();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading expenses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and review all your expenses
          </p>
        </div>
        <Link
          href="/add"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Add Expense
        </Link>
      </div>

      <ExpenseList
        expenses={expenses}
        onDelete={deleteExpense}
        onUpdate={updateExpense}
        onExport={exportCSV}
      />
    </div>
  );
}
