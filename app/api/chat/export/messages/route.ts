import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { toCsv } from "@/lib/export-csv";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String((session as any)?.user?.id ?? "");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = String(searchParams.get("conversationId") ?? "").trim();

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "conversationId requis" },
        { status: 400 }
      );
    }

    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: true,
      },
      take: 5000,
    });

    const csv = toCsv(
      ["Date", "Expéditeur", "Type", "Message", "Fichier", "URL"],
      messages.map((m) => [
        new Date(m.createdAt).toLocaleString("fr-FR"),
        m.sender.fullName,
        m.type,
        m.text ?? "",
        m.fileName ?? "",
        m.fileUrl ?? "",
      ])
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="messages-conversation.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Export messages impossible" },
      { status: 500 }
    );
  }
}