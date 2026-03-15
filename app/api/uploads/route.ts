import { NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Fichier manquant" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = (file.name || "file").replace(/[^\w.\-]+/g, "_");
    const ext = path.extname(safeName) || "";
    const base = path.basename(safeName, ext);

    const hash = crypto.randomBytes(6).toString("hex");
    const finalName = `${base}_${hash}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, finalName);
    await writeFile(fullPath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${finalName}`,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur upload" }, { status: 500 });
  }
}
