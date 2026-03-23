const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ednevnik-backend" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

const { authRouter } = require("./routes/auth.routes");
const { requireAuth } = require("./middlewares/requireAuth");
const { prisma } = require("./db/prisma");

app.use("/auth", authRouter);

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json({
    ok: true,
    user,
  });
});

const { requireRole } = require("./middlewares/requireRole");

app.get("/admin-only", requireAuth, requireRole("ADMIN"), (req, res) => {
  res.json({ ok: true, message: "Welcome admin!" });
});

const { adminUsersRouter } = require("./routes/admin.users.routes");

app.use("/admin/users", requireAuth, requireRole("ADMIN"), adminUsersRouter);

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error.",
  });
});
