import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { fullName: "asc" },
      include: {
        department: true,
        position: true,
      },
      take: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("EmployÃ©s");

    sheet.columns = [
      { header: "Nom complet", key: "fullName", width: 28 },
      { header: "TÃ©lÃ©phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Adresse", key: "address", width: 30 },
      { header: "DÃ©partement", key: "department", width: 20 },
      { header: "Poste", key: "position", width: 20 },
      { header: "Statut", key: "status", width: 14 },
      { header: "Salaire base", key: "baseSalary", width: 16 },
      { header: "Devise", key: "currency", width: 10 },
      { header: "Date embauche", key: "hireDate", width: 18 },
    ];

    employees.forEach((employee) => {
      sheet.addRow({
        fullName: employee.fullName,
        phone: employee.phone ?? "",
        email: employee.email ?? "",
        address: employee.address ?? "",
        department: employee.department?.name ?? "",
        position: employee.position?.name ?? "",
        status: employee.status,
        baseSalary: Number(employee.baseSalary ?? 0),
        currency: employee.currency,
        hireDate: employee.hireDate
          ? new Date(employee.hireDate).toLocaleDateString("fr-FR")
          : "",
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="employes-rh.xlsx"',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error ? e.message : "Export Excel employÃ©s impossible",
      },
      { status: 500 }
    );
  }
}