import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const guard = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!guard.ok) return guard.response;

  try {
    const url = process.env.DATABASE_URL || "";
    const safeUrl =
      url.length > 20 ? url.slice(0, 12) + "..." + url.slice(-8) : url;

    const userCount = await prisma.user.count();

    const admin = await prisma.user.findUnique({
      where: { email: "admin@mwinda.cd" },
      select: { id: true, email: true, isActive: true, passwordHash: true, role: true },
    });

    return NextResponse.json({
      ok: true,
      databaseUrlPreview: safeUrl,
      userCount,
      adminExists: !!admin,
      admin: admin
        ? {
            id: admin.id,
            email: admin.email,
            isActive: admin.isActive,
            role: admin.role,
            passwordHashPresent: !!admin.passwordHash,
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
