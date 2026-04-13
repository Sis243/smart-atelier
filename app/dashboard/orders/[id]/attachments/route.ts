import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeAttachmentType(t?: string | null) {
  const v = String(t ?? "").toUpperCase().trim();

  if (v === "PDF") return "PDF";
  if (v === "IMAGE" || v === "JPG" || v === "JPEG" || v === "PNG" || v === "WEBP") return "IMAGE";
  if (v === "WORD" || v === "DOC" || v === "DOCX") return "WORD";
  if (v === "EXCEL" || v === "XLS" || v === "XLSX" || v === "CSV") return "EXCEL";
  return "OTHER";
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx.params.id;
    const body = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const attachmentRaw = Array.isArray(body.attachments) ? body.attachments[0] : body;

    const url = toStr(attachmentRaw?.url);
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "URL fichier requise" },
        { status: 400 }
      );
    }

    const created = await prisma.orderAttachment.create({
      data: {
        orderId,
        title: toStr(attachmentRaw?.title) || null,
        fileName: toStr(attachmentRaw?.fileName) || null,
        type: normalizeAttachmentType(attachmentRaw?.type) as any,
        url,
      },
    });

    return NextResponse.json({
      ok: true,
      attachment: {
        id: created.id,
        title: created.title ?? "",
        fileName: created.fileName ?? "",
        type: String(created.type ?? ""),
        url: created.url,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}