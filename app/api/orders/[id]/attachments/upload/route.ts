import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db";

export const runtime = "nodejs"; // IMPORTANT pour fs

function guessTypeFromMime(mime: string) {
  const m = (mime || "").toLowerCase();

  if (m === "application/pdf") return "PDF";
  if (m.startsWith("image/")) return "IMAGE";
  if (
    m === "application/msword" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "WORD";
  if (
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "EXCEL";
  return "OTHER";
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function safeName(name: string) {
  return (name || "file")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx.params.id;

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });

    const form = await req.formData();

    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim() || null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Fichier requis (champ: file)" }, { status: 400 });
    }

    const mime = (file.type || "").toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { ok: false, error: `Type non autorisé: ${mime || "inconnu"}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = safeName(file.name || "piece_jointe");
    const ext = path.extname(originalName) || "";
    const base = path.basename(originalName, ext);

    const stamp = Date.now();
    const finalName = `${base}_${stamp}${ext || ""}`;

    const relDir = `/uploads/orders/${orderId}`;
    const absDir = path.join(process.cwd(), "public", relDir);

    await fs.mkdir(absDir, { recursive: true });

    const absPath = path.join(absDir, finalName);
    await fs.writeFile(absPath, buffer);

    const url = `${relDir}/${finalName}`;

    const type = guessTypeFromMime(mime);

    const attachment = await prisma.orderAttachment.create({
      data: {
        orderId,
        title,
        fileName: originalName,
        type: type as any,
        url,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        type: true,
        url: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      attachment: {
        ...attachment,
        type: String(attachment.type),
        createdAt: attachment.createdAt.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
