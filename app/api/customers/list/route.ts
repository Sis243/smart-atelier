import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: { id: true, fullName: true, type: true },
      orderBy: { fullName: "asc" },
      take: 500,
    });

    return NextResponse.json({ ok: true, customers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
