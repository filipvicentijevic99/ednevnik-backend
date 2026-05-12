require("dotenv").config();

const bcrypt = require("bcryptjs");
const { getConfig } = require("../src/config");
const { createPrismaClient } = require("../src/db/prisma");
const { normalizeEmail } = require("../src/utils/users");

const config = getConfig();
const prisma = createPrismaClient({ connectionString: config.databaseUrl });

async function main() {
  const email = normalizeEmail("admin@ednevnik.local");
  const password = "Admin123!";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name: "Admin", passwordHash, role: "ADMIN" },
    create: { name: "Admin", email, passwordHash, role: "ADMIN" },
  });

  console.log("Seed OK:", email, password);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
