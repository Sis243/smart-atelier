import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = (process.argv[2] || "admin@mwinda.cd").trim().toLowerCase();
  const password = (process.argv[3] || "123456").trim();

  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!u) throw new Error(`Utilisateur introuvable: ${email}`);

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash, isActive: true },
  });

  console.log("✅ RESET OK:", email, "=>", password);
}

main()
  .catch((e) => {
    console.error("❌ RESET ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
