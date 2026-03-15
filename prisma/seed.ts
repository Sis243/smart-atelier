import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL manquant. Vérifie ton .env");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const prisma = createPrisma();

const PERMISSIONS: { key: string; label: string }[] = [
  { key: "DASHBOARD_VIEW", label: "Voir le dashboard" },

  { key: "USERS_VIEW", label: "Voir utilisateurs" },
  { key: "USERS_EDIT", label: "Créer/modifier utilisateurs" },

  { key: "CUSTOMERS_VIEW", label: "Voir clients" },
  { key: "CUSTOMERS_CREATE", label: "Créer clients" },

  { key: "ORDERS_VIEW", label: "Voir commandes" },
  { key: "ORDERS_CREATE", label: "Créer commandes" },
  { key: "ORDERS_UPDATE_STATUS", label: "Changer statut commande" },

  { key: "CUT_VIEW", label: "Voir module Coupe" },
  { key: "CUT_UPDATE", label: "Mettre à jour Coupe" },

  { key: "PRODUCTION_VIEW", label: "Voir module Production" },
  { key: "PRODUCTION_UPDATE", label: "Mettre à jour Production" },

  { key: "QUALITY_VIEW", label: "Voir module Qualité" },
  { key: "QUALITY_VALIDATE", label: "Valider/Rejeter Qualité" },

  { key: "DELIVERY_VIEW", label: "Voir module Livraison" },
  { key: "DELIVERY_CONFIRM", label: "Confirmer livraison" },

  { key: "STOCK_VIEW", label: "Voir stock" },
  { key: "STOCK_EDIT", label: "Modifier stock" },

  { key: "ACTIVITY_VIEW", label: "Voir journal activité" },

  { key: "ACCOUNTING_VIEW", label: "Voir comptabilité" },
  { key: "ACCOUNTING_CASH_IN", label: "Encaissements" },
  { key: "ACCOUNTING_CASH_OUT", label: "Décaissements" },
  { key: "ACCOUNTING_INVOICE_CREATE", label: "Créer factures" },
  { key: "ACCOUNTING_REPORTS_VIEW", label: "Voir rapports" },

  { key: "HR_VIEW", label: "Voir RH" },
  { key: "HR_EDIT", label: "Modifier RH" },
  { key: "HR_ATTENDANCE_MANAGE", label: "Gérer présences" },
  { key: "HR_LEAVE_MANAGE", label: "Gérer congés" },
  { key: "HR_PAYROLL_MANAGE", label: "Gérer paie" },

  { key: "CHAT_VIEW", label: "Voir messagerie" },
  { key: "CHAT_SEND", label: "Envoyer messages" },
  { key: "CHAT_MANAGE_GROUPS", label: "Gérer groupes" },

  { key: "PRESENCE_VIEW", label: "Voir présence" },

  { key: "NOTIFICATIONS_VIEW", label: "Voir notifications" },
  { key: "NOTIFICATIONS_MANAGE", label: "Gérer notifications" },
];

const ACCOUNTS = [
  { code: "5710", name: "Caisse", type: "CAISSE" },
  { code: "5120", name: "Banque", type: "BANQUE" },
  { code: "7010", name: "Ventes", type: "VENTE" },
  { code: "6010", name: "Achats matières", type: "CHARGE" },
  { code: "6410", name: "Salaires", type: "CHARGE" },
  { code: "6580", name: "Frais divers", type: "CHARGE" },
];

const DEPARTMENTS = ["Coupe", "Production", "Qualité", "Livraison", "Caisse", "Admin"];
const POSITIONS = [
  "Chef atelier",
  "Coupeur",
  "Couturier",
  "Contrôleur qualité",
  "Livreur",
  "Caissier",
  "Admin",
];

async function main() {
  // Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label },
      create: p,
    });
  }

  // Comptes compta
  for (const a of ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: a.code },
      update: { name: a.name, type: a.type as any },
      create: a as any,
    });
  }

  // RH: départements + postes
  for (const name of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of POSITIONS) {
    await prisma.position.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ✅ SUPERADMIN
  const email = "admin@mwinda.cd";
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "SUPERADMIN",
      role: "SUPERADMIN",
      isActive: true,
      passwordHash,
    },
    create: {
      email,
      fullName: "SUPERADMIN",
      role: "SUPERADMIN",
      isActive: true,
      passwordHash,
    },
    select: { id: true, email: true },
  });

  // Assign all permissions to superadmin
  const allPerms = await prisma.permission.findMany({ select: { id: true } });
  for (const perm of allPerms) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: { userId: admin.id, permissionId: perm.id },
      },
      update: {},
      create: { userId: admin.id, permissionId: perm.id },
    });
  }

  // Presence init
  await prisma.userPresence.upsert({
    where: { userId: admin.id },
    update: { status: "OFFLINE" as any },
    create: { userId: admin.id, status: "OFFLINE" as any },
  });

  console.log("✅ Seed done.");
  console.log("SUPERADMIN:", email, "password: 123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
