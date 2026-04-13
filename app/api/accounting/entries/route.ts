import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(toNum(searchParams.get("limit"), 100), 1), 500);

    const entries = await prisma.ledgerEntry.findMany({
      orderBy: { date: "desc" },
      include: {
        account: true,
        order: true,
        invoice: true,
        expense: true,
      },
      take: limit,
    });

    return NextResponse.json({ ok: true, entries });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const accountId = toStr(body.accountId);
    const label = toStr(body.label);
    const debit = toNum(body.debit, 0);
    const credit = toNum(body.credit, 0);
    const currency = toStr(body.currency) === "CDF" ? "CDF" : "USD";
    const fxRate = toNum(body.fxRate, 1);

    if (!accountId || !label) {
      return NextResponse.json(
        { ok: false, error: "Compte et libellÃ© requis" },
        { status: 400 }
      );
    }

    if (debit <= 0 && credit <= 0) {
      return NextResponse.json(
        { ok: false, error: "Débit ou crédit requis" },
        { status: 400 }
      );
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        accountId,
        label,
        debit,
        credit,
        currency: currency as any,
        fxRate,
      },
    });

    return NextResponse.json({ ok: true, entry });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "CrÃ©ation impossible" },
      { status: 500 }
    );
  }
}
