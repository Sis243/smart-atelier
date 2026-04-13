import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const guard = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!guard.ok) return guard.response;

  try {
    const email = "admin@mwinda.cd";
    const password = "123456";
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: `Utilisateur introuvable: ${email}`,
        },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
      },
    });

    return NextResponse.json({
      ok: true,
      email,
      message: "Mot de passe admin réinitialisé avec succès.",
    });
  } catch (e: any) {
    console.error("[RESET-ADMIN]", e);
    return NextResponse.json(
      {
        ok: false,
        error: String(e?.message || e),
      },
      { status: 500 }
    );
  }
}
