"use client";

import Link from "next/link";
import { PlusCircle, TrendingUp, Sparkles } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseFormData, Category } from "@/types/expense";
import { format, subDays } from "date-fns";

const SEED_EXPENSES: { daysAgo: number; amount: string; category: Category; description: string }[] = [
  { daysAgo: 0, amount: "12.50", category: "Food", description: "Lunch at Chipotle" },
  { daysAgo: 1, amount: "45.00", category: "Transportation", description: "Uber ride to airport" },
  { daysAgo: 2, amount: "9.99", category: "Entertainment", description: "Netflix subscription" },
  { daysAgo: 3, amount: "87.32", category: "Shopping", description: "Amazon order" },
  { daysAgo: 4, amount: "120.00", category: "Bills", description: "Electric bill" },
  { daysAgo: 5, amount: "34.20", category: "Food", description: "Grocery run" },
  { daysAgo: 7, amount: "15.00", category: "Entertainment", description: "Movie tickets" },
  { daysAgo: 8, amount: "55.00", category: "Transportation", description: "Monthly transit pass" },
  { daysAgo: 10, amount: "28.75", category: "Food", description: "Dinner with friends" },
  { daysAgo: 12, amount: "200.00", category: "Bills", description: "Internet bill" },
  { daysAgo: 14, amount: "67.00", category: "Shopping", description: "New shoes" },
  { daysAgo: 16, amount: "8.50", category: "Food", description: "Morning coffee" },
  { daysAgo: 18, amount: "40.00", category: "Entertainment", description: "Spotify + Apple Music" },
  { daysAgo: 20, amount: "95.00", category: "Bills", description: "Phone bill" },
  { daysAgo: 22, amount: "22.00", category: "Transportation", description: "Gas station" },
  // older months
  { daysAgo: 35, amount: "145.00", category: "Shopping", description: "Clothing store" },
  { daysAgo: 38, amount: "18.00", category: "Food", description: "Pizza delivery" },
  { daysAgo: 42, amount: "250.00", category: "Bills", description: "Rent utilities" },
  { daysAgo: 50, amount: "30.00", category: "Entertainment", description: "Concert ticket" },
  { daysAgo: 60, amount: "75.00", category: "Transportation", description: "Car maintenance" },
  { daysAgo: 65, amount: "43.20", category: "Food", description: "Sushi night" },
  { daysAgo: 70, amount: "180.00", category: "Bills", description: "Water + gas bill" },
  { daysAgo: 75, amount: "110.00", category: "Shopping", description: "Home supplies" },
  { daysAgo: 80, amount: "25.00", category: "Entertainment", description: "Video game" },
  { daysAgo: 90, amount: "160.00", category: "Bills", description: "Insurance payment" },
  { daysAgo: 95, amount: "32.00", category: "Food", description: "Thai restaurant" },
  { daysAgo: 100, amount: "60.00", category: "Transportation", description: "Parking fees" },
  { daysAgo: 110, amount: "55.00", category: "Shopping", description: "Books" },
  { daysAgo: 120, amount: "90.00", category: "Entertainment", description: "Gym membership" },
  { daysAgo: 130, amount: "200.00", category: "Bills", description: "Credit card fee" },
];

export default function EmptyState() {
  const { addExpense } = useExpenses();

  function loadSampleData() {
    for (const seed of SEED_EXPENSES) {
      const data: ExpenseFormData = {
        date: format(subDays(new Date(), seed.daysAgo), "yyyy-MM-dd"),
        amount: seed.amount,
        category: seed.category,
        description: seed.description,
      };
      addExpense(data);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
        <TrendingUp size={30} className="text-indigo-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Welcome to ExpenseTracker!
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Start tracking your expenses to see spending summaries, category
        breakdowns, and monthly trends right here on the dashboard.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/add"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          Add Your First Expense
        </Link>
        <button
          onClick={loadSampleData}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Sparkles size={16} className="text-purple-500" />
          Load Sample Data
        </button>
      </div>
    </div>
  );
}
