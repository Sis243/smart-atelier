import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const permissions = await prisma.permission.findMany({
    orderBy: { key: "asc" },
    select: { id: true, key: true, label: true },
  });

  return NextResponse.json(permissions);
}
