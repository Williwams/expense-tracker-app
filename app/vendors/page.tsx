"use client";

import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils";
import { Category, CATEGORY_ICONS, CATEGORY_BG } from "@/types/expense";
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
import { Store, TrendingUp, Hash, DollarSign } from "lucide-react";
import { parseISO, isAfter, startOfMonth, subMonths, startOfYear } from "date-fns";

type TimePeriod = "all" | "this-month" | "3-months" | "6-months" | "this-year";

interface VendorData {
  name: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  topCategory: Category;
  percentage: number;
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "this-month", label: "This Month" },
  { value: "3-months", label: "Last 3 Months" },
  { value: "6-months", label: "Last 6 Months" },
  { value: "this-year", label: "This Year" },
];

const BAR_COLORS = [
  "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe",
  "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe",
];

function getDateCutoff(period: TimePeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "this-month":
      return startOfMonth(now);
    case "3-months":
      return subMonths(now, 3);
    case "6-months":
      return subMonths(now, 6);
    case "this-year":
      return startOfYear(now);
    default:
      return null;
  }
}

export default function VendorsPage() {
  const { expenses, isLoaded } = useExpenses();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");

  const filteredExpenses = useMemo(() => {
    const cutoff = getDateCutoff(timePeriod);
    if (!cutoff) return expenses;
    return expenses.filter((e) => isAfter(parseISO(e.date), cutoff) || parseISO(e.date).getTime() === cutoff.getTime());
  }, [expenses, timePeriod]);

  const { vendors, totalSpending, mostFrequentVendor } = useMemo(() => {
    const vendorMap = new Map<
      string,
      { total: number; count: number; categories: Map<Category, number> }
    >();

    let total = 0;
    for (const e of filteredExpenses) {
      total += e.amount;
      const existing = vendorMap.get(e.description) ?? {
        total: 0,
        count: 0,
        categories: new Map<Category, number>(),
      };
      existing.total += e.amount;
      existing.count += 1;
      existing.categories.set(
        e.category,
        (existing.categories.get(e.category) ?? 0) + 1
      );
      vendorMap.set(e.description, existing);
    }

    let mostFrequent = "";
    let maxCount = 0;

    const vendorList: VendorData[] = Array.from(vendorMap.entries())
      .map(([name, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count;
          mostFrequent = name;
        }

        // Find the most common category
        let topCat: Category = "Other";
        let topCatCount = 0;
        for (const [cat, count] of data.categories) {
          if (count > topCatCount) {
            topCatCount = count;
            topCat = cat;
          }
        }

        return {
          name,
          totalAmount: data.total,
          transactionCount: data.count,
          averageAmount: data.total / data.count,
          topCategory: topCat,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 20);

    return {
      vendors: vendorList,
      totalSpending: total,
      mostFrequentVendor: mostFrequent,
    };
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    return vendors.slice(0, 10).map((v) => ({
      name: v.name.length > 20 ? v.name.slice(0, 18) + "..." : v.name,
      amount: v.totalAmount,
    }));
  }, [vendors]);

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

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Store size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No expenses yet</h2>
        <p className="text-gray-500">Add some expenses to see your top vendors.</p>
      </div>
    );
  }

  const uniqueVendorCount = new Set(filteredExpenses.map((e) => e.description)).size;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Top Vendors</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          See where your money goes by vendor
        </p>
      </div>

      {/* Time period filter */}
      <div className="flex flex-wrap gap-2">
        {TIME_PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimePeriod(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Store size={20} className="text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Unique Vendors</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uniqueVendorCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Spending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalSpending)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Most Frequent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 truncate">
            {mostFrequentVendor || "N/A"}
          </p>
        </div>
      </div>

      {/* Bar chart - Top 10 */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Vendors by Spending
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `$${(v / 1).toLocaleString()}`}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  fontSize={12}
                  tick={{ fill: "#374151" }}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={24}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ranked vendor list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Vendor Rankings
        </h2>
        <div className="space-y-3">
          {vendors.map((vendor, index) => (
            <div
              key={vendor.name}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Rank */}
              <div className="flex items-center gap-3 sm:w-[280px] shrink-0">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    index < 3
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {vendor.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        CATEGORY_BG[vendor.topCategory]
                      }`}
                    >
                      {CATEGORY_ICONS[vendor.topCategory]} {vendor.topCategory}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Hash size={10} />
                      {vendor.transactionCount} txn{vendor.transactionCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar + amounts */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(vendor.totalAmount)}
                  </span>
                  <span className="text-xs text-gray-500">
                    avg {formatCurrency(vendor.averageAmount)} | {vendor.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{
                      width: `${Math.max(vendor.percentage, 0.5)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {vendors.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No vendor data for the selected time period.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
