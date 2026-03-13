"use client";

import { useMemo } from "react";
import { Expense, CATEGORY_COLORS, CATEGORY_ICONS, Category } from "@/types/expense";
import { formatCurrency, getCategoryTotals } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, differenceInCalendarDays, subDays, format } from "date-fns";
import { Flame } from "lucide-react";

const DAILY_BUDGET = 100;

interface MonthlyInsightsProps {
  expenses: Expense[];
}

export default function MonthlyInsights({ expenses }: MonthlyInsightsProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyExpenses = useMemo(
    () =>
      expenses.filter((e) =>
        isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
      ),
    [expenses, monthStart, monthEnd]
  );

  const categoryTotals = useMemo(
    () => getCategoryTotals(monthlyExpenses),
    [monthlyExpenses]
  );

  const top3 = categoryTotals.slice(0, 3);

  const totalSpending = useMemo(
    () => monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthlyExpenses]
  );

  const donutData = useMemo(
    () =>
      categoryTotals.map((c) => ({
        name: c.category,
        value: c.total,
      })),
    [categoryTotals]
  );

  // Budget streak: count consecutive days (ending today) where daily spend <= DAILY_BUDGET
  const budgetStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const day = subDays(today, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const dayTotal = expenses
        .filter((e) => e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      if (dayTotal <= DAILY_BUDGET) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [expenses]);

  const daysInMonth = differenceInCalendarDays(monthEnd, monthStart) + 1;
  const dayOfMonth = differenceInCalendarDays(now, monthStart) + 1;
  const streakPercent = Math.min((budgetStreak / daysInMonth) * 100, 100);

  const BAR_COLORS: Record<number, string> = {
    0: "#ef4444",
    1: "#06b6d4",
    2: "#3b82f6",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(now, "MMMM yyyy")} — {formatCurrency(totalSpending)} spent so far
        </p>
      </div>

      {/* Donut Chart Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Spending Breakdown</h2>
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name as Category]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Spending</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(totalSpending)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Categories */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Categories</h2>
        {top3.length === 0 ? (
          <p className="text-gray-400 text-sm">No expenses this month.</p>
        ) : (
          <div className="space-y-4">
            {top3.map((item, idx) => {
              const pct = totalSpending > 0 ? (item.total / totalSpending) * 100 : 0;
              const barColor = BAR_COLORS[idx] ?? "#6b7280";
              return (
                <div key={item.category} className="flex items-center gap-4">
                  <div
                    className="w-1.5 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: barColor }}
                  />
                  <span className="text-2xl shrink-0">
                    {CATEGORY_ICONS[item.category]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-gray-900">
                        {item.category}
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Streak Card */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={20} className="text-green-500" />
          <h2 className="text-lg font-semibold text-gray-800">Budget Streak</h2>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span className="text-5xl font-extrabold text-green-500">{budgetStreak}</span>
            <span className="text-lg text-gray-500 ml-2">days</span>
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-4 rounded-full bg-green-400 transition-all"
                style={{ width: `${streakPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Under ${DAILY_BUDGET}/day — Day {dayOfMonth} of {daysInMonth}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
