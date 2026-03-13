"use client";

import { useExpenses } from "@/hooks/useExpenses";
import MonthlyInsights from "@/components/insights/MonthlyInsights";

export default function InsightsPage() {
  const { expenses, isLoaded } = useExpenses();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <MonthlyInsights expenses={expenses} />;
}
