export const dynamic = "force-dynamic";

// app/api/customers/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        type: true,
      },
    });

    return NextResponse.json({
      ok: true,
      customers,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}