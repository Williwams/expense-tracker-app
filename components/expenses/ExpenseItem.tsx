"use client";

import { useState } from "react";
import { Expense, CATEGORY_BG, CATEGORY_ICONS } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, X, Check } from "lucide-react";

interface Props {
  expense: Expense;
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (expense: Expense) => void;
}

export default function ExpenseItem({ expense, onDelete, onEdit }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 group transition-colors">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl flex-shrink-0">
        {CATEGORY_ICONS[expense.category]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {expense.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400">
            {format(parseISO(expense.date), "MMM d, yyyy")}
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

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(expense.amount)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {confirming ? (
          <>
            <span className="text-xs text-gray-500 mr-1">Delete?</span>
            <button
              onClick={() => onDelete(expense.id)}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Confirm delete"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              title="Cancel"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(expense)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit expense"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete expense"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
