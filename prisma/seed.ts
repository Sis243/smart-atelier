import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../lib/env";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Smart Atelier...");

  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10);

  const permissions = [
    { key: "USERS_MANAGE", label: "Gérer les utilisateurs" },
    { key: "CUSTOMERS_MANAGE", label: "Gérer les clients" },
    { key: "ORDERS_MANAGE", label: "Gérer les commandes" },
    { key: "CUT_MANAGE", label: "Gérer la coupe" },
    { key: "PRODUCTION_MANAGE", label: "Gérer la production" },
    { key: "QUALITY_MANAGE", label: "Gérer la qualité" },
    { key: "DELIVERY_MANAGE", label: "Gérer la livraison" },
    { key: "STOCK_MANAGE", label: "Gérer le stock" },
    { key: "HR_MANAGE", label: "Gérer les RH" },
    { key: "ACCOUNTING_MANAGE", label: "Gérer la comptabilité" },
    { key: "CHAT_USE", label: "Utiliser la messagerie" },
    { key: "DASHBOARD_VIEW", label: "Voir le dashboard" },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { label: permission.label },
      create: permission,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: {
      fullName: env.SEED_ADMIN_NAME,
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
    create: {
      fullName: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
  });

  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });

  for (const perm of allPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: admin.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        permissionId: perm.id,
      },
    });
  }

  const departments = ["Direction", "Coupe", "Production", "Qualité", "Livraison", "RH", "Comptabilité", "Stock"];
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const positions = [
    "Directeur",
    "Chef d’atelier",
    "Coupeur",
    "Couturier",
    "Contrôleur qualité",
    "Livreur",
    "RH",
    "Comptable",
    "Magasinier",
  ];

  for (const name of positions) {
    await prisma.position.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const accountingAccounts = [
    { code: "411", name: "Clients", type: "ACTIF" },
    { code: "571", name: "Caisse", type: "TRESORERIE" },
    { code: "601", name: "Achats stock", type: "CHARGE" },
    { code: "701", name: "Ventes prestations", type: "PRODUIT" },
    { code: "707", name: "Ventes marchandises", type: "PRODUIT" },
    { code: "421", name: "Personnel rémunérations dues", type: "PASSIF" },
    { code: "401", name: "Fournisseurs", type: "PASSIF" },
    { code: "801", name: "Capital / fonds propres", type: "CAPITAL" },
  ];

  for (const account of accountingAccounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {
        name: account.name,
        type: account.type,
      },
      create: account,
    });
  }

  const suppliers = [
    { name: "Tissus Congo", phone: "+243000000001", email: "contact@tissus-congo.cd", address: "Kinshasa" },
    { name: "Accessoires Atelier", phone: "+243000000002", email: "contact@accessoires.cd", address: "Gombe" },
  ];

  for (const supplier of suppliers) {
    await prisma.stockSupplier.upsert({
      where: { name: supplier.name },
      update: supplier,
      create: supplier,
    });
  }

  const stockItems = [
    { name: "Tissu Bazin Bleu", category: "Tissu", unit: "mètre", quantity: 120, minQuantity: 20, unitCost: 8 },
    { name: "Boutons noirs", category: "Accessoire", unit: "pièce", quantity: 500, minQuantity: 100, unitCost: 0.1 },
    { name: "Fermetures éclairs", category: "Accessoire", unit: "pièce", quantity: 150, minQuantity: 30, unitCost: 0.8 },
    { name: "Fil couture blanc", category: "Consommable", unit: "bobine", quantity: 80, minQuantity: 15, unitCost: 1.5 },
  ];

  for (const item of stockItems) {
    await prisma.stockItem.upsert({
      where: { id: `${item.name}` },
      update: {},
      create: item as any,
    }).catch(async () => {
      const existing = await prisma.stockItem.findFirst({ where: { name: item.name } });
      if (!existing) {
        await prisma.stockItem.create({ data: item });
      }
    });
  }

  const customers = [
    { fullName: "Client Démo 1", type: "STANDARD", phone: "+243000000101", email: "client1@test.cd", address: "Kinshasa", note: "Client test" },
    { fullName: "Client Démo 2", type: "VIP", phone: "+243000000102", email: "client2@test.cd", address: "Gombe", note: "Client prioritaire" },
  ];

  for (const customer of customers) {
    const existing = await prisma.customer.findFirst({ where: { fullName: customer.fullName } });
    if (!existing) {
      await prisma.customer.create({ data: customer });
    }
  }

  const employeeRows = [
    { fullName: "Jean Coupe", email: "coupe@mwinda.cd", role: "COUPE", dept: "Coupe", pos: "Coupeur" },
    { fullName: "Marie Production", email: "production@mwinda.cd", role: "PRODUCTION", dept: "Production", pos: "Couturier" },
    { fullName: "Paul Qualité", email: "qualite@mwinda.cd", role: "QUALITE", dept: "Qualité", pos: "Contrôleur qualité" },
    { fullName: "Ruth Livraison", email: "livraison@mwinda.cd", role: "LOGISTIQUE", dept: "Livraison", pos: "Livreur" },
    { fullName: "Nadia RH", email: "rh@mwinda.cd", role: "RH", dept: "RH", pos: "RH" },
    { fullName: "Eric Comptable", email: "compta@mwinda.cd", role: "COMPTABLE", dept: "Comptabilité", pos: "Comptable" },
    { fullName: "Saïd Stock", email: "stock@mwinda.cd", role: "ADMIN", dept: "Stock", pos: "Magasinier" },
  ];

  for (const row of employeeRows) {
    const userPassword = await bcrypt.hash("12345678", 10);

    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {
        fullName: row.fullName,
        passwordHash: userPassword,
        role: row.role as any,
        isActive: true,
      },
      create: {
        fullName: row.fullName,
        email: row.email,
        passwordHash: userPassword,
        role: row.role as any,
        isActive: true,
      },
    });

    const department = await prisma.department.findUnique({ where: { name: row.dept } });
    const position = await prisma.position.findUnique({ where: { name: row.pos } });

    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: user.id },
    });

    if (!existingEmployee) {
      await prisma.employee.create({
        data: {
          fullName: row.fullName,
          email: row.email,
          phone: null,
          address: "Kinshasa",
          status: "ACTIVE",
          baseSalary: 300,
          currency: "USD",
          hireDate: new Date(),
          departmentId: department?.id ?? null,
          positionId: position?.id ?? null,
          userId: user.id,
        },
      });
    }
  }

  console.log("✅ Seed terminé.");
  console.log(`Admin: ${env.SEED_ADMIN_EMAIL}`);
  console.log(`Password: ${env.SEED_ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });