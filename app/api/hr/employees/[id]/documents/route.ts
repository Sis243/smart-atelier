import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

function extFromName(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
}

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await context.params;
    const prismaAny = prisma as any;

    if (prismaAny.employeeDocument) {
      const documents = await prismaAny.employeeDocument.findMany({
        where: { employeeId: id },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ ok: true, documents });
    }

    const employee = await prismaAny.employee.findUnique({
      where: { id },
      select: {
        id: true,
        documentUrl: true,
      },
    });

    const documents = employee?.documentUrl
      ? [
          {
            id: "legacy",
            name: "Document",
            url: employee.documentUrl,
            mimeType: null,
            size: null,
          },
        ]
      : [];

    return NextResponse.json({ ok: true, documents });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur lecture documents" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await context.params;
    const prismaAny = prisma as any;

    const employee = await prismaAny.employee.findUnique({
      where: { id },
      select: { id: true, documentUrl: true },
    });

    if (!employee) {
      return NextResponse.json(
        { ok: false, error: "EmployÃ© introuvable." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files").filter((f) => f instanceof File) as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Aucun document envoyÃ©." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "hr",
      "employees",
      id,
      "documents"
    );

    await mkdir(uploadDir, { recursive: true });

    const saved: Array<{
      name: string;
      url: string;
      mimeType: string;
      size: number;
    }> = [];

    for (const file of files.slice(0, 5)) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Format non supportÃ© pour ${file.name}.`,
          },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            ok: false,
            error: `Le fichier ${file.name} dÃ©passe 10 MB.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = extFromName(file.name);
      const fileName = `${randomUUID()}.${ext}`;
      const fullPath = path.join(uploadDir, fileName);

      await writeFile(fullPath, buffer);

      saved.push({
        name: file.name,
        url: `/uploads/hr/employees/${id}/documents/${fileName}`,
        mimeType: file.type,
        size: file.size,
      });
    }

    if (prismaAny.employeeDocument) {
      await prismaAny.employeeDocument.createMany({
        data: saved.map((doc) => ({
          employeeId: id,
          name: doc.name,
          url: doc.url,
          mimeType: doc.mimeType,
          size: doc.size,
        })),
      });
    } else if (!employee.documentUrl && saved[0]) {
      await prismaAny.employee.update({
        where: { id },
        data: {
          documentUrl: saved[0].url,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      documents: saved,
      message: "Documents enregistrÃ©s avec succÃ¨s.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Upload documents impossible" },
      { status: 500 }
    );
  }
}