import { Expense, FilterOptions, Category } from "@/types/expense";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  format,
  subMonths,
} from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function filterExpenses(
  expenses: Expense[],
  filters: FilterOptions
): Expense[] {
  return expenses.filter((expense) => {
    if (
      filters.search &&
      !expense.description
        .toLowerCase()
        .includes(filters.search.toLowerCase()) &&
      !expense.category.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    if (filters.category !== "All" && expense.category !== filters.category) {
      return false;
    }

    if (filters.dateFrom && expense.date < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && expense.date > filters.dateTo) {
      return false;
    }

    return true;
  });
}

export function getTotalSpending(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getMonthlySpending(expenses: Expense[]): number {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return expenses
    .filter((e) => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getWeeklySpending(expenses: Expense[]): number {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return expenses
    .filter((e) => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getCategoryTotals(
  expenses: Expense[]
): { category: Category; total: number; count: number }[] {
  const map = new Map<Category, { total: number; count: number }>();
  for (const e of expenses) {
    const prev = map.get(e.category) ?? { total: 0, count: 0 };
    map.set(e.category, {
      total: prev.total + e.amount,
      count: prev.count + 1,
    });
  }
  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);
}

export function getTopCategory(expenses: Expense[]): Category | null {
  const totals = getCategoryTotals(expenses);
  return totals.length > 0 ? totals[0].category : null;
}

export function getMonthlyChartData(
  expenses: Expense[],
  monthsBack = 6
): { month: string; amount: number }[] {
  const now = new Date();
  return Array.from({ length: monthsBack }, (_, i) => {
    const date = subMonths(now, monthsBack - 1 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const amount = expenses
      .filter((e) => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start, end });
      })
      .reduce((sum, e) => sum + e.amount, 0);
    return { month: format(date, "MMM"), amount };
  });
}

export function getCategoryChartData(
  expenses: Expense[]
): { name: string; value: number }[] {
  const totals = getCategoryTotals(expenses);
  return totals.map((t) => ({ name: t.category, value: t.total }));
}

export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}
