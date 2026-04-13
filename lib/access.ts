// lib/access.ts
import { AppRole, normalizeRole } from "@/lib/role-permissions";

export type ModuleKey =
  | "dashboard"
  | "users"
  | "customers"
  | "orders"
  | "cut"
  | "production"
  | "quality"
  | "delivery"
  | "stock"
  | "hr"
  | "accounting"
  | "chat"
  | "activity";

const modulePermissionPrefixes: Record<ModuleKey, string[]> = {
  dashboard: ["DASHBOARD_"],
  users: ["USERS_"],
  customers: ["CUSTOMERS_"],
  orders: ["ORDERS_"],
  cut: ["CUT_"],
  production: ["PRODUCTION_"],
  quality: ["QUALITY_"],
  delivery: ["DELIVERY_"],
  stock: ["STOCK_"],
  hr: ["HR_"],
  accounting: ["ACCOUNTING_"],
  chat: ["CHAT_"],
  activity: ["ACTIVITY_"],
};

const accessMap: Record<ModuleKey, AppRole[]> = {
  dashboard: [
    "SUPERADMIN",
    "ADMIN",
    "MANAGER",
    "COUPE",
    "PRODUCTION",
    "QUALITE",
    "LOGISTIQUE",
    "CAISSIER",
    "RH",
    "COMPTABLE",
  ],
  users: ["SUPERADMIN", "ADMIN"],
  customers: ["SUPERADMIN", "ADMIN", "MANAGER", "CAISSIER"],
  orders: [
    "SUPERADMIN",
    "ADMIN",
    "MANAGER",
    "COUPE",
    "PRODUCTION",
    "QUALITE",
    "LOGISTIQUE",
    "CAISSIER",
    "COMPTABLE",
  ],
  cut: ["SUPERADMIN", "ADMIN", "MANAGER", "COUPE"],
  production: ["SUPERADMIN", "ADMIN", "MANAGER", "PRODUCTION"],
  quality: ["SUPERADMIN", "ADMIN", "MANAGER", "QUALITE"],
  delivery: ["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE"],
  stock: ["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "COMPTABLE"],
  hr: ["SUPERADMIN", "ADMIN", "RH", "MANAGER"],
  accounting: ["SUPERADMIN", "ADMIN", "COMPTABLE", "CAISSIER", "MANAGER"],
  chat: [
    "SUPERADMIN",
    "ADMIN",
    "MANAGER",
    "COUPE",
    "PRODUCTION",
    "QUALITE",
    "LOGISTIQUE",
    "CAISSIER",
    "RH",
    "COMPTABLE",
  ],
  activity: ["SUPERADMIN", "ADMIN", "MANAGER"],
};

export function canAccessModule(role: unknown, moduleKey: ModuleKey) {
  const r = normalizeRole(role);
  if (!r) return false;
  return accessMap[moduleKey].includes(r);
}

export function canAccessModuleWithPermissions(
  role: unknown,
  permissionKeys: readonly string[],
  moduleKey: ModuleKey
) {
  const keys = permissionKeys.map((key) => String(key || "").trim().toUpperCase());

  if (keys.includes("*")) return true;

  if (keys.length > 0) {
    const prefixes = modulePermissionPrefixes[moduleKey] ?? [];
    return keys.some((key) => prefixes.some((prefix) => key.startsWith(prefix)));
  }

  const r = normalizeRole(role);
  if (r === "SUPERADMIN" || r === "ADMIN") {
    return canAccessModule(r, moduleKey);
  }

  return false;
}

export function canSeeMoney(role: unknown) {
  const r = normalizeRole(role);
  return ["SUPERADMIN", "ADMIN", "MANAGER", "CAISSIER", "COMPTABLE"].includes(r);
}

export function canEditWorkflowStep(role: unknown, step: "cut" | "production" | "quality" | "delivery") {
  const r = normalizeRole(role);

  if (!r) return false;
  if (r === "SUPERADMIN" || r === "ADMIN" || r === "MANAGER") return true;

  if (step === "cut") return r === "COUPE";
  if (step === "production") return r === "PRODUCTION";
  if (step === "quality") return r === "QUALITE";
  if (step === "delivery") return r === "LOGISTIQUE";

  return false;
}
