"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense, ExpenseFormData } from "@/types/expense";
import { format } from "date-fns";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await apiFetch<Expense[]>("/api/expenses");
      setExpenses(data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(
    async (data: ExpenseFormData): Promise<Expense> => {
      const expense = await apiFetch<Expense>("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          amount: parseFloat(data.amount),
          category: data.category,
          description: data.description.trim(),
        }),
      });
      setExpenses((prev) => [expense, ...prev]);
      return expense;
    },
    []
  );

  const updateExpense = useCallback(
    async (id: string, data: ExpenseFormData): Promise<void> => {
      const updated = await apiFetch<Expense>(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          amount: parseFloat(data.amount),
          category: data.category,
          description: data.description.trim(),
        }),
      });
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    },
    []
  );

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const exportCSV = useCallback((): void => {
    const header = ["Date", "Amount", "Category", "Description"];
    const rows = expenses.map((e) => [
      e.date,
      e.amount.toFixed(2),
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [expenses]);

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    exportCSV,
  };
}
