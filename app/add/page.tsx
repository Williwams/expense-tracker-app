"use client";

import { useRouter } from "next/navigation";
import { useExpenses } from "@/hooks/useExpenses";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { ExpenseFormData } from "@/types/expense";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function AddExpensePage() {
  const router = useRouter();
  const { addExpense } = useExpenses();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(data: ExpenseFormData) {
    try {
      const expense = await addExpense(data);
      setSuccessMsg(
        `Added: ${expense.description} — $${expense.amount.toFixed(2)}`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setSuccessMsg(null);
      alert(err instanceof Error ? err.message : "Failed to add expense");
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Record a new expense to track your spending
        </p>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-3 rounded-xl animate-pulse">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <ExpenseForm onSubmit={handleSubmit} />

      <p className="text-center text-sm text-gray-400">
        Want to see all expenses?{" "}
        <button
          onClick={() => router.push("/expenses")}
          className="text-indigo-600 hover:underline font-medium"
        >
          View expense list
        </button>
      </p>
    </div>
  );
}
