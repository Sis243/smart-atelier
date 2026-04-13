import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET() {

  try {
    const prismaAny = prisma as any;

    const employees: any[] = await prismaAny.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        position: true,
        user: true,
      },
    });

    const rows = employees.map((employee: any) => ({
      id: employee.id,
      employeeCode: employee.employeeCode ?? "",
      fullName: employee.fullName ?? "",
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      address: employee.address ?? "",
      department: employee.department?.name ?? "",
      position: employee.position?.name ?? "",
      salary: employee.baseSalary ?? employee.salary ?? 0,
      hireDate: employee.hireDate ?? null,
      userEmail: employee.user?.email ?? "",
      photoUrl: employee.photoUrl ?? null,
      documentUrl: employee.documentUrl ?? null,
      documentsCount: employee.documentUrl ? 1 : 0,
      status: employee.status ?? "ACTIVE",
      createdAt: employee.createdAt,
    }));

    const employeeOptions = rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
    }));

    return NextResponse.json({
      ok: true,
      rows,
      employees: employeeOptions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur liste employÃ©s" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const prismaAny = prisma as any;
    const body = await req.json();

    const fullName = toStr(body.fullName);
    const phone = toStr(body.phone) || null;
    const email = toStr(body.email) || null;
    const address = toStr(body.address) || null;
    const hireDate = body.hireDate ? new Date(body.hireDate) : null;
    const status = toStr(body.status) || "ACTIVE";
    const baseSalary = toNum(body.baseSalary, 0);
    const currency = toStr(body.currency) === "CDF" ? "CDF" : "USD";
    const departmentId = toStr(body.departmentId) || null;
    const positionId = toStr(body.positionId) || null;

    if (!fullName) {
      return NextResponse.json(
        { ok: false, error: "Nom complet requis" },
        { status: 400 }
      );
    }

    const created = await prismaAny.employee.create({
      data: {
        fullName,
        phone,
        email,
        address,
        hireDate,
        status,
        baseSalary,
        currency,
        departmentId,
        positionId,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "CrÃ©ation employÃ© impossible" },
      { status: 500 }
    );
  }
}
