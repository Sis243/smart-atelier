import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const periodLabel = toStr(body.periodLabel);

    if (!periodLabel) {
      return NextResponse.json(
        { ok: false, error: "periodLabel requis" },
        { status: 400 }
      );
    }

    const totalEntries = await prisma.ledgerEntry.count();

    const log = await prisma.activityLog.create({
      data: {
        action: "ACCOUNTING_PERIOD_CLOSE",
        entity: "AccountingPeriod",
        metaJson: JSON.stringify({
          periodLabel,
          totalEntries,
          closedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "ClÃ´ture enregistrÃ©e",
      closure: {
        id: log.id,
        periodLabel,
        totalEntries,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur clÃ´ture" },
      { status: 500 }
    );
  }
}