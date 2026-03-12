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
  differenceInDays,
  getDay,
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

export function getDailyAverage(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;
  const dates = expenses.map((e) => parseISO(e.date));
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
  const days = Math.max(differenceInDays(latest, earliest), 1);
  return getTotalSpending(expenses) / days;
}

export function getMonthOverMonthChange(expenses: Expense[]): number | null {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonth = subMonths(now, 1);
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);

  const thisMonthTotal = expenses
    .filter((e) => isWithinInterval(parseISO(e.date), { start: thisMonthStart, end: thisMonthEnd }))
    .reduce((sum, e) => sum + e.amount, 0);

  const lastMonthTotal = expenses
    .filter((e) => isWithinInterval(parseISO(e.date), { start: lastMonthStart, end: lastMonthEnd }))
    .reduce((sum, e) => sum + e.amount, 0);

  if (lastMonthTotal === 0) return null;
  return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
}

export function getLargestExpense(expenses: Expense[]): Expense | null {
  if (expenses.length === 0) return null;
  return expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0]);
}

export function getAverageTransaction(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;
  return getTotalSpending(expenses) / expenses.length;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDayOfWeekData(
  expenses: Expense[]
): { day: string; amount: number; count: number; average: number }[] {
  const buckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
  for (const e of expenses) {
    const dayIndex = getDay(parseISO(e.date));
    buckets[dayIndex].total += e.amount;
    buckets[dayIndex].count += 1;
  }
  // Reorder to start on Monday
  const ordered = [1, 2, 3, 4, 5, 6, 0];
  return ordered.map((i) => ({
    day: DAY_NAMES[i],
    amount: buckets[i].total,
    count: buckets[i].count,
    average: buckets[i].count > 0 ? buckets[i].total / buckets[i].count : 0,
  }));
}
