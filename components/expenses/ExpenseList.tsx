"use client";

import { useState } from "react";
import { Expense, ExpenseFormData, FilterOptions } from "@/types/expense";
import { filterExpenses, sortExpenses, formatCurrency, getTotalSpending } from "@/lib/utils";
import ExpenseItem from "./ExpenseItem";
import EditModal from "./EditModal";
import FilterBar from "./FilterBar";
import { Download, Receipt } from "lucide-react";
import Link from "next/link";

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, data: ExpenseFormData) => void | Promise<void>;
  onExport: () => void;
}

const DEFAULT_FILTERS: FilterOptions = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

export default function ExpenseList({
  expenses,
  onDelete,
  onUpdate,
  onExport,
}: Props) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const sorted = sortExpenses(expenses);
  const filtered = filterExpenses(sorted, filters);
  const filteredTotal = getTotalSpending(filtered);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Expenses
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({filtered.length} of {expenses.length})
              </span>
            </h2>
            {filtered.length > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                Total: <span className="font-semibold text-gray-900">{formatCurrency(filteredTotal)}</span>
              </p>
            )}
          </div>
          <button
            onClick={onExport}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Receipt size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">
              {expenses.length === 0
                ? "No expenses yet."
                : "No expenses match your filters."}
            </p>
            {expenses.length === 0 && (
              <Link
                href="/add"
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                Add your first expense
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-2">
            {filtered.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onDelete={onDelete}
                onEdit={setEditingExpense}
              />
            ))}
          </div>
        )}
      </div>

      <EditModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={onUpdate}
      />
    </div>
  );
}
