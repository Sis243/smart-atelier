// lib/accounting-auto.ts
import { prisma } from "@/lib/prisma";

type CurrencyCode = "USD" | "CDF";

async function getAccountIdByCode(code: string) {
  const account = await prisma.account.findUnique({
    where: { code },
    select: { id: true },
  });

  if (!account) {
    throw new Error(`Compte comptable introuvable: ${code}`);
  }

  return account.id;
}

export async function createEntry(params: {
  accountCode: string;
  label: string;
  debit?: number;
  credit?: number;
  currency?: CurrencyCode;
  fxRate?: number;
  orderId?: string | null;
  paymentId?: string | null;
  invoiceId?: string | null;
  expenseId?: string | null;
}) {
  const accountId = await getAccountIdByCode(params.accountCode);

  return prisma.ledgerEntry.create({
    data: {
      accountId,
      label: params.label,
      debit: Number(params.debit ?? 0),
      credit: Number(params.credit ?? 0),
      currency: (params.currency ?? "USD") as any,
      fxRate: Number(params.fxRate ?? 1),
      orderId: params.orderId ?? null,
      paymentId: params.paymentId ?? null,
      invoiceId: params.invoiceId ?? null,
      expenseId: params.expenseId ?? null,
    },
  });
}

export async function createPaymentEntries(params: {
  paymentId: string;
  orderId?: string | null;
  amount: number;
  currency?: CurrencyCode;
  fxRate?: number;
  label: string;
}) {
  const amount = Number(params.amount || 0);
  const currency = (params.currency ?? "USD") as CurrencyCode;
  const fxRate = Number(params.fxRate ?? 1);

  await createEntry({
    accountCode: "571",
    label: `${params.label} - Encaissement`,
    debit: amount,
    credit: 0,
    currency,
    fxRate,
    orderId: params.orderId ?? null,
    paymentId: params.paymentId,
  });

  await createEntry({
    accountCode: "411",
    label: `${params.label} - Client`,
    debit: 0,
    credit: amount,
    currency,
    fxRate,
    orderId: params.orderId ?? null,
    paymentId: params.paymentId,
  });
}

export async function createExpenseEntries(params: {
  expenseId: string;
  amount: number;
  currency?: CurrencyCode;
  fxRate?: number;
  label: string;
}) {
  const amount = Number(params.amount || 0);
  const currency = (params.currency ?? "USD") as CurrencyCode;
  const fxRate = Number(params.fxRate ?? 1);

  await createEntry({
    accountCode: "601",
    label: `${params.label} - Charge`,
    debit: amount,
    credit: 0,
    currency,
    fxRate,
    expenseId: params.expenseId,
  });

  await createEntry({
    accountCode: "571",
    label: `${params.label} - Caisse/Banque`,
    debit: 0,
    credit: amount,
    currency,
    fxRate,
    expenseId: params.expenseId,
  });
}