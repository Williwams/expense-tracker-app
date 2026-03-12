"use client";

import { Expense, CATEGORY_ICONS } from "@/types/expense";
import {
  formatCurrency,
  getTotalSpending,
  getMonthlySpending,
  getWeeklySpending,
  getTopCategory,
  getCategoryTotals,
} from "@/lib/utils";
import { TrendingUp, Calendar, CreditCard, Tag } from "lucide-react";

interface Props {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: Props) {
  const total = getTotalSpending(expenses);
  const monthly = getMonthlySpending(expenses);
  const weekly = getWeeklySpending(expenses);
  const topCategory = getTopCategory(expenses);
  const categoryTotals = getCategoryTotals(expenses);
  const topCategoryTotal =
    topCategory
      ? categoryTotals.find((c) => c.category === topCategory)?.total ?? 0
      : 0;

  const cards = [
    {
      title: "All-Time Total",
      value: formatCurrency(total),
      sub: `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`,
      icon: CreditCard,
      color: "bg-indigo-500",
      bgLight: "bg-indigo-50",
      textLight: "text-indigo-600",
    },
    {
      title: "This Month",
      value: formatCurrency(monthly),
      sub: "Current month spending",
      icon: Calendar,
      color: "bg-purple-500",
      bgLight: "bg-purple-50",
      textLight: "text-purple-600",
    },
    {
      title: "This Week",
      value: formatCurrency(weekly),
      sub: "Mon – Sun",
      icon: TrendingUp,
      color: "bg-violet-500",
      bgLight: "bg-violet-50",
      textLight: "text-violet-600",
    },
    {
      title: "Top Category",
      value: topCategory
        ? `${CATEGORY_ICONS[topCategory]} ${topCategory}`
        : "—",
      sub: topCategory ? formatCurrency(topCategoryTotal) : "No data yet",
      icon: Tag,
      color: "bg-fuchsia-500",
      bgLight: "bg-fuchsia-50",
      textLight: "text-fuchsia-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <div className={`${card.bgLight} p-2 rounded-lg`}>
                <Icon size={18} className={card.textLight} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
