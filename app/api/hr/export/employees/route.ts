import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esc(value: unknown) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {

  try {
    const employees = await prisma.employee.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        department: true,
        position: true,
        user: true,
      },
    });

    const headers = [
      "ID",
      "Matricule",
      "Nom complet",
      "Email",
      "TÃ©lÃ©phone",
      "DÃ©partement",
      "Poste",
      "Salaire",
      "Date d'embauche",
      "Utilisateur liÃ©",
      "CrÃ©Ã© le",
    ];

    const rows = employees.map((employee) => [
      employee.id,
      (employee as any).employeeCode ?? (employee as any).matricule ?? "",
      (employee as any).fullName ?? "",
      (employee as any).email ?? "",
      (employee as any).phone ?? "",
      employee.department?.name ?? "",
      employee.position?.name ?? employee.position?.name ?? "",
      String((employee as any).salary ?? ""),
      (employee as any).hireDate
        ? new Date((employee as any).hireDate).toISOString()
        : "",
      employee.user?.email ?? "",
      employee.createdAt ? new Date(employee.createdAt).toISOString() : "",
    ]);

    const csv = [
      headers.map(esc).join(","),
      ...rows.map((row) => row.map(esc).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="employees-export.csv"',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Export employÃ©s impossible" },
      { status: 500 }
    );
  }
}