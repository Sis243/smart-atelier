import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      accountsCount,
      entriesCount,
      invoicesCount,
      expensesCount,
      paidInvoices,
      paidExpenses,
      latestEntries,
    ] = await Promise.all([
      prisma.account.count(),
      prisma.ledgerEntry.count(),
      prisma.invoice.count(),
      prisma.expense.count(),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true, totalAmount: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.findMany({
        orderBy: { date: "desc" },
        take: 10,
        include: {
          account: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        accountsCount,
        entriesCount,
        invoicesCount,
        expensesCount,
        totalInvoicePaid: paidInvoices._sum.paidAmount ?? 0,
        totalInvoiceIssued: paidInvoices._sum.totalAmount ?? 0,
        totalExpenses: paidExpenses._sum.amount ?? 0,
      },
      latestEntries,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}