import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        database: "disconnected",
        error: e?.message ?? "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}