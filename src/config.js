const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173";
const DEFAULT_PORT = 3000;

function getRequiredEnv(env, key) {
  const value = env[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function getConfig(env = process.env) {
  const portValue = env.PORT;
  const port =
    typeof portValue === "string" && portValue.trim()
      ? Number(portValue)
      : DEFAULT_PORT;

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return {
    port,
    databaseUrl: getRequiredEnv(env, "DATABASE_URL"),
    jwtSecret: getRequiredEnv(env, "JWT_SECRET"),
    frontendOrigin: env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN,
  };
}

module.exports = {
  getConfig,
  DEFAULT_FRONTEND_ORIGIN,
  DEFAULT_PORT,
};
