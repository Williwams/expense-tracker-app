"use client";

import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency, getCategoryTotals, getTotalSpending } from "@/lib/utils";
import {
  Category,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from "@/types/expense";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { parseISO, startOfMonth, startOfYear, subMonths, isAfter } from "date-fns";
import { TrendingUp, Hash, DollarSign } from "lucide-react";

type TimePeriod = "all" | "this-month" | "3-months" | "6-months" | "this-year";

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "this-month", label: "This Month" },
  { value: "3-months", label: "Last 3 Months" },
  { value: "6-months", label: "Last 6 Months" },
  { value: "this-year", label: "This Year" },
];

function getFilterDate(period: TimePeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "all":
      return null;
    case "this-month":
      return startOfMonth(now);
    case "3-months":
      return subMonths(now, 3);
    case "6-months":
      return subMonths(now, 6);
    case "this-year":
      return startOfYear(now);
  }
}

export default function CategoriesPage() {
  const { expenses, isLoaded } = useExpenses();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");

  const filteredExpenses = useMemo(() => {
    const filterDate = getFilterDate(timePeriod);
    if (!filterDate) return expenses;
    return expenses.filter((e) => isAfter(parseISO(e.date), filterDate));
  }, [expenses, timePeriod]);

  const categoryTotals = useMemo(
    () => getCategoryTotals(filteredExpenses),
    [filteredExpenses]
  );

  const totalSpending = useMemo(
    () => getTotalSpending(filteredExpenses),
    [filteredExpenses]
  );

  const chartData = useMemo(
    () =>
      categoryTotals.map((ct) => ({
        name: ct.category,
        amount: ct.total,
        fill: CATEGORY_COLORS[ct.category],
      })),
    [categoryTotals]
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Top Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          See where your money goes, ranked by total spending
        </p>
      </div>

      {/* Time period filter */}
      <div className="flex flex-wrap gap-2">
        {TIME_PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimePeriod(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timePeriod === value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Hash size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Categories Used</p>
              <p className="text-xl font-bold text-gray-900">
                {categoryTotals.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spending</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalSpending)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredExpenses.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">
            No expenses found for the selected time period.
          </p>
        </div>
      ) : (
        <>
          {/* Ranked category list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Spending by Category
            </h2>
            <div className="space-y-4">
              {categoryTotals.map((ct, index) => {
                const percentage =
                  totalSpending > 0
                    ? (ct.total / totalSpending) * 100
                    : 0;
                const avgAmount =
                  ct.count > 0 ? ct.total / ct.count : 0;

                return (
                  <div
                    key={ct.category}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">
                        {index + 1}
                      </span>
                    </div>

                    {/* Category info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {CATEGORY_ICONS[ct.category as Category]}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {ct.category}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              CATEGORY_COLORS[ct.category as Category],
                          }}
                        />
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>
                          {ct.count} transaction{ct.count !== 1 ? "s" : ""}
                        </span>
                        <span>Avg: {formatCurrency(avgAmount)}</span>
                        <span>{percentage.toFixed(1)}% of total</span>
                      </div>
                    </div>

                    {/* Total amount */}
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(ct.total)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Spending Overview
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Amount",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
