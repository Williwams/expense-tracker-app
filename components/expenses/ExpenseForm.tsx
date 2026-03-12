"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Expense,
  ExpenseFormData,
  CATEGORIES,
  CATEGORY_ICONS,
} from "@/types/expense";
import { format } from "date-fns";
import { Save, X } from "lucide-react";

interface Props {
  onSubmit: (data: ExpenseFormData) => void;
  initialData?: Expense;
  isEditing?: boolean;
}

const EMPTY: ExpenseFormData = {
  date: format(new Date(), "yyyy-MM-dd"),
  amount: "",
  category: "Food",
  description: "",
};

interface FormErrors {
  date?: string;
  amount?: string;
  description?: string;
}

export default function ExpenseForm({
  onSubmit,
  initialData,
  isEditing = false,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date,
        amount: initialData.amount.toString(),
        category: initialData.category,
        description: initialData.description,
      });
    }
  }, [initialData]);

  function validate(data: ExpenseFormData): FormErrors {
    const errs: FormErrors = {};
    if (!data.date) errs.date = "Date is required.";
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      errs.amount = "Enter a valid amount greater than 0.";
    }
    if (parseFloat(data.amount) > 1_000_000) {
      errs.amount = "Amount seems too large. Please double-check.";
    }
    if (!data.description.trim()) {
      errs.description = "Description is required.";
    } else if (data.description.trim().length < 2) {
      errs.description = "Description must be at least 2 characters.";
    } else if (data.description.trim().length > 120) {
      errs.description = "Description must be under 120 characters.";
    }
    return errs;
  }

  function handleChange(
    field: keyof ExpenseFormData,
    value: string
  ) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (submitted) {
      setErrors(validate(updated));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit(form);
    if (!isEditing) {
      setForm({ ...EMPTY, date: format(new Date(), "yyyy-MM-dd") });
      setSubmitted(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
    >
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.date}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => handleChange("date", e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
            errors.date
              ? "border-red-400 bg-red-50"
              : "border-gray-200 bg-gray-50 hover:border-gray-300"
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-red-500">{errors.date}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
              errors.amount
                ? "border-red-400 bg-red-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange("category", cat)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.category === cat
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Lunch at Chipotle"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          maxLength={120}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
            errors.description
              ? "border-red-400 bg-red-50"
              : "border-gray-200 bg-gray-50 hover:border-gray-300"
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-500">{errors.description}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-400 text-right ml-auto">
            {form.description.length}/120
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Save size={16} />
          {isEditing ? "Save Changes" : "Add Expense"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </form>
  );
}
