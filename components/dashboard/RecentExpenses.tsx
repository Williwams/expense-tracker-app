"use client";

import Link from "next/link";
import { Expense, CATEGORY_BG, CATEGORY_ICONS } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";

interface Props {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: Props) {
  const recent = expenses.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Recent Expenses
          </h2>
          <p className="text-sm text-gray-400">Your latest transactions</p>
        </div>
        <Link
          href="/expenses"
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          No expenses yet.{" "}
          <Link href="/add" className="text-indigo-600 hover:underline">
            Add your first one!
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recent.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">
                {CATEGORY_ICONS[expense.category]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {expense.description}
                </p>
                <p className="text-xs text-gray-400">
                  {format(parseISO(expense.date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(expense.amount)}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    CATEGORY_BG[expense.category]
                  }`}
                >
                  {expense.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
