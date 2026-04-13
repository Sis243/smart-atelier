import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await context.params;
    const prismaAny = prisma as any;

    const employee = await prismaAny.employee.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json(
        { ok: false, error: "EmployÃ© introuvable." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Aucun fichier envoyÃ©." },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Format non supportÃ©. Utilise JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: "Image trop lourde. Maximum 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const fileName = `${id}-${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "employees");

    await mkdir(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, fileName);
    await writeFile(fullPath, buffer);

    const photoUrl = `/uploads/employees/${fileName}`;

    await prismaAny.employee.update({
      where: { id },
      data: { photoUrl },
    });

    return NextResponse.json({
      ok: true,
      photoUrl,
      message: "Photo de profil mise Ã  jour avec succÃ¨s.",
    });
  } catch (error) {
    console.error("POST /api/hr/employees/[id]/photo error:", error);

    return NextResponse.json(
      { ok: false, error: "Erreur serveur lors de lâ€™upload de la photo." },
      { status: 500 }
    );
  }
}
