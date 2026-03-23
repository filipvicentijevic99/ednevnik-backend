require("dotenv").config();

const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@ednevnik.local";
  const password = "Admin123!";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Admin", email, passwordHash, role: "ADMIN" },
  });

  console.log("✅ Seed OK:", email, password);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
