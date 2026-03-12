import { z } from "zod";

const CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export const expenseSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1_000_000, "Amount cannot exceed 1,000,000")
    .refine((n) => Number(n.toFixed(2)) === n, "Amount can have at most 2 decimal places"),
  category: z.enum(CATEGORIES, {
    error: `Category must be one of: ${CATEGORIES.join(", ")}`,
  }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description cannot exceed 200 characters"),
});

export const expenseUpdateSchema = expenseSchema.partial();

export type ValidatedExpense = z.infer<typeof expenseSchema>;
