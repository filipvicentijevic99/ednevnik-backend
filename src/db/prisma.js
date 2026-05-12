const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

function createPrismaClient({ connectionString }) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

module.exports = { createPrismaClient };
