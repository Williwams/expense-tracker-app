"use client";

import { Expense } from "@/types/expense";
import { getDayOfWeekData, formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  expenses: Expense[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: { day: string; amount: number; count: number; average: number } }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-lg font-bold text-violet-600">
          ${data.amount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">
          {data.count} transaction{data.count !== 1 ? "s" : ""} · avg ${data.average.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
}

export default function DayOfWeekChart({ expenses }: Props) {
  const data = getDayOfWeekData(expenses);
  const hasData = data.some((d) => d.amount > 0);

  const peakDay = data.reduce((max, d) => (d.amount > max.amount ? d : max), data[0]);
  const quietDay = data.reduce((min, d) => {
    if (min.amount === 0 && d.amount > 0) return d;
    if (d.amount === 0) return min;
    return d.amount < min.amount ? d : min;
  }, data[0]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Spending by Day of Week
        </h2>
        <p className="text-sm text-gray-400">When you spend the most</p>
      </div>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No spending data yet.
        </div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f3ff" }} />
                <Bar
                  dataKey="amount"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day insights */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1 p-3 rounded-xl bg-violet-50">
              <p className="text-xs text-gray-500 font-medium">Peak Day</p>
              <p className="text-sm font-bold text-violet-700">{peakDay.day}</p>
              <p className="text-xs text-gray-400">{formatCurrency(peakDay.amount)} total</p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-emerald-50">
              <p className="text-xs text-gray-500 font-medium">Quietest Day</p>
              <p className="text-sm font-bold text-emerald-700">{quietDay.day}</p>
              <p className="text-xs text-gray-400">{formatCurrency(quietDay.amount)} total</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
