import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expenseSchema } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: result.data,
  });

  return NextResponse.json({
    ...expense,
    createdAt: expense.createdAt.toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
