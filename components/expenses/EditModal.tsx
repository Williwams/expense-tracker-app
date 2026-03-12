"use client";

import { Expense, ExpenseFormData } from "@/types/expense";
import ExpenseForm from "./ExpenseForm";
import { X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  expense: Expense | null;
  onClose: () => void;
  onSave: (id: string, data: ExpenseFormData) => void | Promise<void>;
}

export default function EditModal({ expense, onClose, onSave }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!expense) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Edit Expense</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 pt-3">
          <ExpenseForm
            initialData={expense}
            isEditing
            onSubmit={(data) => {
              onSave(expense.id, data);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
