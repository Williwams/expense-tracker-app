"use client";

import { Expense, CATEGORY_ICONS } from "@/types/expense";
import {
  formatCurrency,
  getDailyAverage,
  getMonthOverMonthChange,
  getLargestExpense,
  getAverageTransaction,
} from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  BarChart3,
  Zap,
} from "lucide-react";

interface Props {
  expenses: Expense[];
}

export default function SpendingInsights({ expenses }: Props) {
  const dailyAvg = getDailyAverage(expenses);
  const momChange = getMonthOverMonthChange(expenses);
  const largest = getLargestExpense(expenses);
  const avgTransaction = getAverageTransaction(expenses);

  const getTrendIcon = () => {
    if (momChange === null) return <Minus size={16} className="text-gray-400" />;
    if (momChange > 5) return <TrendingUp size={16} className="text-red-500" />;
    if (momChange < -5) return <TrendingDown size={16} className="text-emerald-500" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getTrendColor = () => {
    if (momChange === null) return "text-gray-500";
    if (momChange > 5) return "text-red-600";
    if (momChange < -5) return "text-emerald-600";
    return "text-gray-500";
  };

  const getTrendLabel = () => {
    if (momChange === null) return "No prior month data";
    const direction = momChange > 0 ? "up" : "down";
    return `${Math.abs(momChange).toFixed(1)}% ${direction} from last month`;
  };

  const insights = [
    {
      label: "Daily Average",
      value: formatCurrency(dailyAvg),
      detail: "Avg spending per day",
      icon: DollarSign,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Month Trend",
      value: getTrendIcon(),
      detail: getTrendLabel(),
      icon: BarChart3,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueExtra: (
        <span className={`text-lg font-bold ${getTrendColor()}`}>
          {momChange !== null ? `${momChange > 0 ? "+" : ""}${momChange.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      label: "Avg Transaction",
      value: formatCurrency(avgTransaction),
      detail: `Across ${expenses.length} transactions`,
      icon: Zap,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Spending Insights
        </h2>
        <p className="text-sm text-gray-400">Patterns and trends</p>
      </div>

      <div className="space-y-4">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`${item.iconBg} p-2 rounded-lg flex-shrink-0`}>
                <Icon size={18} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {item.label}
                </p>
                <div className="flex items-center gap-2">
                  {item.valueExtra ?? (
                    <p className="text-lg font-bold text-gray-900">{item.value}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">{item.detail}</p>
              </div>
            </div>
          );
        })}

        {/* Largest expense highlight */}
        {largest && (
          <div className="mt-2 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Largest Expense
            </p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg flex-shrink-0">
                {CATEGORY_ICONS[largest.category]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {largest.description}
                </p>
                <p className="text-xs text-gray-500">
                  {format(parseISO(largest.date), "MMM d, yyyy")} · {largest.category}
                </p>
              </div>
              <p className="text-base font-bold text-red-600 flex-shrink-0">
                {formatCurrency(largest.amount)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
