import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json();

  const password = String(body.password || "");
  if (!password || password.length < 6)
    return NextResponse.json({ error: "Mot de passe min 6 caractères" }, { status: 400 });

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
