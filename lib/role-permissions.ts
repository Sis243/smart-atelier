export const ROLES = [
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
] as const;

export type AppRole = (typeof ROLES)[number];

export const QUALITY_ROLES: AppRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "QUALITE",
];

export const DELIVERY_ROLES: AppRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "LOGISTIQUE",
];

export const STOCK_ROLES: AppRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "LOGISTIQUE",
  "COMPTABLE",
];

export const ACCOUNTING_ROLES: AppRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "COMPTABLE",
  "CAISSIER",
];

export const HR_ROLES: AppRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "RH",
];

export const USER_MANAGEMENT_ROLES: AppRole[] = [
  "SUPERADMIN",
  "ADMIN",
];

const PERMISSIONS: Record<AppRole, string[]> = {
  SUPERADMIN: ["*"],

  ADMIN: ["*"],

  MANAGER: [
    "dashboard.view",
    "users.view",
    "customers.view",
    "orders.view",
    "orders.create",
    "orders.update",
    "workflow.view",
    "workflow.update",
    "cut.view",
    "production.view",
    "quality.view",
    "quality.update",
    "delivery.view",
    "delivery.update",
    "stock.view",
    "stock.update",
    "accounting.view",
    "hr.view",
    "chat.view",
    "chat.send",
    "activity.view",
    "notifications.view",
  ],

  COUPE: [
    "dashboard.view",
    "orders.view",
    "workflow.view",
    "workflow.update",
    "cut.view",
    "cut.update",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],

  PRODUCTION: [
    "dashboard.view",
    "orders.view",
    "workflow.view",
    "workflow.update",
    "production.view",
    "production.update",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],

  QUALITE: [
    "dashboard.view",
    "orders.view",
    "workflow.view",
    "workflow.update",
    "quality.view",
    "quality.update",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],

  LOGISTIQUE: [
    "dashboard.view",
    "orders.view",
    "workflow.view",
    "delivery.view",
    "delivery.update",
    "stock.view",
    "stock.create",
    "stock.update",
    "stock.export",
    "stock.moves.view",
    "stock.moves.create",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],

  CAISSIER: [
    "dashboard.view",
    "orders.view",
    "accounting.view",
    "payments.view",
    "payments.create",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],

  RH: [
    "dashboard.view",
    "hr.view",
    "hr.create",
    "hr.update",
    "hr.delete",
    "users.view",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],

  COMPTABLE: [
    "dashboard.view",
    "accounting.view",
    "accounting.create",
    "accounting.update",
    "accounting.export",
    "stock.view",
    "stock.export",
    "chat.view",
    "chat.send",
    "notifications.view",
  ],
};

export function normalizeRole(role: unknown): AppRole | "" {
  const value = String(role ?? "").trim().toUpperCase();
  return (ROLES as readonly string[]).includes(value) ? (value as AppRole) : "";
}

export function hasPermission(role: unknown, permission: string): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  const allowed = PERMISSIONS[normalizedRole] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

export function hasAnyPermission(role: unknown, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: unknown, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}