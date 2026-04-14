import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in .env or .env.local");
}

const connectionString = databaseUrl;
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@mwinda.cd";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "123456";
const adminName = process.env.SEED_ADMIN_NAME ?? "Administrateur";

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const permissions = [
  { key: "USERS_MANAGE", label: "Gerer les utilisateurs" },
  { key: "CUSTOMERS_MANAGE", label: "Gerer les clients" },
  { key: "ORDERS_MANAGE", label: "Gerer les commandes" },
  { key: "CUT_MANAGE", label: "Gerer la coupe" },
  { key: "PRODUCTION_MANAGE", label: "Gerer la production" },
  { key: "QUALITY_MANAGE", label: "Gerer la qualite" },
  { key: "DELIVERY_MANAGE", label: "Gerer la livraison" },
  { key: "STOCK_MANAGE", label: "Gerer le stock" },
  { key: "HR_MANAGE", label: "Gerer les RH" },
  { key: "ACCOUNTING_MANAGE", label: "Gerer la comptabilite" },
  { key: "CHAT_USE", label: "Utiliser la messagerie" },
  { key: "DASHBOARD_VIEW", label: "Voir le dashboard" },
];

async function main() {
  const target = /localhost|127\.0\.0\.1/.test(connectionString)
    ? "local database"
    : "remote database";
  console.log(`Reset admin target: ${target}`);

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { label: permission.label },
      create: permission,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminName,
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
    create: {
      fullName: adminName,
      email: adminEmail,
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
  });

  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });

  for (const permission of allPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: admin.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`Admin ready: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error("Reset admin failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
