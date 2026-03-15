import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const roleRaw = String(body.role || "MANAGER").trim().toUpperCase();
  const role = (UserRole as any)[roleRaw] ? (roleRaw as UserRole) : UserRole.MANAGER;

  if (!fullName) return NextResponse.json({ error: "Nom complet requis" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
  if (!password || password.length < 6)
    return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
      isActive: true,
    },
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

  return NextResponse.json(user, { status: 201 });
}
