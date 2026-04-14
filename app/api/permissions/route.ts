import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET() {
  const perms = await prisma.permission.findMany({
    select: { id: true, key: true, label: true },
    orderBy: { key: "asc" },
  });

  return NextResponse.json(perms);
}
