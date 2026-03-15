import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing (.env).");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = getPrisma();

  const email = "admin@mwinda.cd";
  const password = "123456";
  const passwordHash = await bcrypt.hash(password, 10);

  // 1) Upsert SUPERADMIN
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

  // 2) Permissions (si tables existent)
  try {
    const perms = await prisma.permission.findMany({ select: { id: true } });
    for (const perm of perms) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: { userId: admin.id, permissionId: perm.id },
        },
        update: {},
        create: { userId: admin.id, permissionId: perm.id },
      });
    }
  } catch {}

  // 3) Presence (si table existe)
  try {
    await prisma.userPresence.upsert({
      where: { userId: admin.id },
      update: { status: "OFFLINE" as any },
      create: { userId: admin.id, status: "OFFLINE" as any },
    });
  } catch {}

  console.log("✅ Admin reset OK:", email, "password:", password);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ reset-admin error:", e);
  process.exit(1);
});
