import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json();

  const data: any = {};

  if ("fullName" in body) data.fullName = String(body.fullName || "").trim();
  if ("email" in body) data.email = String(body.email || "").trim().toLowerCase();
  if ("isActive" in body) data.isActive = Boolean(body.isActive);

  if ("role" in body) {
    const roleRaw = String(body.role || "").trim().toUpperCase();
    data.role = (UserRole as any)[roleRaw] ? (roleRaw as UserRole) : undefined;
  }

  // ✅ validation
  if ("fullName" in data && !data.fullName) {
    return NextResponse.json({ error: "Nom complet requis" }, { status: 400 });
  }
  if ("email" in data && !data.email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  // ✅ email unique (si on change email)
  if (data.email) {
    const exists = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id },
      },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
