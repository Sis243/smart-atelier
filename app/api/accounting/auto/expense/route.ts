import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExpenseEntries } from "@/lib/accounting-auto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const expenseId = String(body.expenseId ?? "").trim();

    if (!expenseId) {
      return NextResponse.json(
        { ok: false, error: "expenseId requis" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json(
        { ok: false, error: "DÃ©pense introuvable" },
        { status: 404 }
      );
    }

    const exists = await prisma.ledgerEntry.findFirst({
      where: { expenseId },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json({ ok: true, message: "Ã‰critures dÃ©jÃ  gÃ©nÃ©rÃ©es" });
    }

    await createExpenseEntries({
      expenseId: expense.id,
      amount: expense.amount,
      currency: expense.currency as any,
      fxRate: expense.fxRate ?? 1,
      label: expense.label,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur automatique dÃ©pense" },
      { status: 500 }
    );
  }
}