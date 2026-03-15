import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function defaultPermissionKeysForRole(role: string) {
  const r = (role || "").toUpperCase();

  // ✅ base pour tout le monde
  const BASE = ["DASHBOARD_VIEW", "PRESENCE_VIEW", "NOTIFICATIONS_VIEW"];

  if (r === "SUPERADMIN") return ["*"]; // tout

  if (r === "ADMIN") {
    return uniq([
      ...BASE,

      "USERS_VIEW",
      "USERS_EDIT",

      "CUSTOMERS_VIEW",
      "CUSTOMERS_CREATE",

      "ORDERS_VIEW",
      "ORDERS_CREATE",
      "ORDERS_UPDATE_STATUS",

      "CUT_VIEW",
      "CUT_UPDATE",

      "PRODUCTION_VIEW",
      "PRODUCTION_UPDATE",

      "QUALITY_VIEW",
      "QUALITY_VALIDATE",

      "DELIVERY_VIEW",
      "DELIVERY_CONFIRM",

      "STOCK_VIEW",
      "STOCK_EDIT",

      "ACTIVITY_VIEW",

      "ACCOUNTING_VIEW",
      "ACCOUNTING_CASH_IN",
      "ACCOUNTING_CASH_OUT",
      "ACCOUNTING_INVOICE_CREATE",
      "ACCOUNTING_REPORTS_VIEW",

      "HR_VIEW",
      "HR_EDIT",
      "HR_ATTENDANCE_MANAGE",
      "HR_LEAVE_MANAGE",
      "HR_PAYROLL_MANAGE",

      "CHAT_VIEW",
      "CHAT_SEND",
      "CHAT_MANAGE_GROUPS",
    ]);
  }

  if (r === "MANAGER") {
    return uniq([
      ...BASE,
      "CUSTOMERS_VIEW",
      "CUSTOMERS_CREATE",
      "ORDERS_VIEW",
      "ORDERS_CREATE",
      "ORDERS_UPDATE_STATUS",
      "CUT_VIEW",
      "PRODUCTION_VIEW",
      "QUALITY_VIEW",
      "DELIVERY_VIEW",
      "STOCK_VIEW",
      "ACTIVITY_VIEW",
      "CHAT_VIEW",
      "CHAT_SEND",
    ]);
  }

  if (r === "COUPE") {
    return uniq([...BASE, "CUT_VIEW", "CUT_UPDATE", "ORDERS_VIEW", "CUSTOMERS_VIEW", "CHAT_VIEW", "CHAT_SEND"]);
  }

  if (r === "PRODUCTION") {
    return uniq([
      ...BASE,
      "PRODUCTION_VIEW",
      "PRODUCTION_UPDATE",
      "ORDERS_VIEW",
      "CUSTOMERS_VIEW",
      "CHAT_VIEW",
      "CHAT_SEND",
    ]);
  }

  if (r === "QUALITE") {
    return uniq([
      ...BASE,
      "QUALITY_VIEW",
      "QUALITY_VALIDATE",
      "ORDERS_VIEW",
      "CUSTOMERS_VIEW",
      "CHAT_VIEW",
      "CHAT_SEND",
    ]);
  }

  if (r === "LOGISTIQUE") {
    return uniq([
      ...BASE,
      "DELIVERY_VIEW",
      "DELIVERY_CONFIRM",
      "ORDERS_VIEW",
      "CUSTOMERS_VIEW",
      "STOCK_VIEW",
      "CHAT_VIEW",
      "CHAT_SEND",
    ]);
  }

  if (r === "CAISSIER") {
    return uniq([
      ...BASE,
      "ACCOUNTING_VIEW",
      "ACCOUNTING_CASH_IN",
      "ACCOUNTING_CASH_OUT",
      "ORDERS_VIEW",
      "CUSTOMERS_VIEW",
      "ACTIVITY_VIEW",
    ]);
  }

  if (r === "COMPTABLE") {
    return uniq([
      ...BASE,
      "ACCOUNTING_VIEW",
      "ACCOUNTING_CASH_IN",
      "ACCOUNTING_CASH_OUT",
      "ACCOUNTING_INVOICE_CREATE",
      "ACCOUNTING_REPORTS_VIEW",
      "ACTIVITY_VIEW",
    ]);
  }

  if (r === "RH") {
    return uniq([
      ...BASE,
      "HR_VIEW",
      "HR_EDIT",
      "HR_ATTENDANCE_MANAGE",
      "HR_LEAVE_MANAGE",
      "HR_PAYROLL_MANAGE",
      "ACTIVITY_VIEW",
    ]);
  }

  // fallback minimal
  return uniq([...BASE, "CUSTOMERS_VIEW", "ORDERS_VIEW"]);
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = params.id;

  // 1) user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // 2) keys
  const keys = defaultPermissionKeysForRole(user.role);

  // 3) permissions ids
  let perms: { id: string }[] = [];

  if (keys.includes("*")) {
    perms = await prisma.permission.findMany({ select: { id: true } });
  } else {
    perms = await prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true },
    });
  }

  // 4) replace all safely
  await prisma.$transaction([
    prisma.userPermission.deleteMany({ where: { userId } }),
    ...perms.map((p) =>
      prisma.userPermission.create({
        data: { userId, permissionId: p.id },
      })
    ),
  ]);

  return NextResponse.json({
    ok: true,
    role: user.role,
    appliedCount: perms.length,
  });
}
