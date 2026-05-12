require("dotenv").config();

const { createApp } = require("./app");
const { getConfig } = require("./config");
const { createPrismaClient } = require("./db/prisma");

const config = getConfig();
const prisma = createPrismaClient({ connectionString: config.databaseUrl });
const app = createApp({
  prisma,
  jwtSecret: config.jwtSecret,
  frontendOrigin: config.frontendOrigin,
});

const server = app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
