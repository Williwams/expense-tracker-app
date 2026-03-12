import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expenseSchema } from "@/lib/validation";

export async function GET() {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    expenses.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = expenseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: result.data,
  });

  return NextResponse.json(
    { ...expense, createdAt: expense.createdAt.toISOString() },
    { status: 201 }
  );
}
