"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense, ExpenseFormData } from "@/types/expense";
import { format } from "date-fns";

const STORAGE_KEY = "expense-tracker-data";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

function saveToStorage(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // ignore storage errors
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    setExpenses(stored);
    setIsLoaded(true);
  }, []);

  const addExpense = useCallback(
    (data: ExpenseFormData): Expense => {
      const expense: Expense = {
        id: generateId(),
        date: data.date,
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [expense, ...expenses];
      setExpenses(updated);
      saveToStorage(updated);
      return expense;
    },
    [expenses]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData): void => {
      const updated = expenses.map((e) =>
        e.id === id
          ? {
              ...e,
              date: data.date,
              amount: parseFloat(data.amount),
              category: data.category,
              description: data.description.trim(),
            }
          : e
      );
      setExpenses(updated);
      saveToStorage(updated);
    },
    [expenses]
  );

  const deleteExpense = useCallback(
    (id: string): void => {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveToStorage(updated);
    },
    [expenses]
  );

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
