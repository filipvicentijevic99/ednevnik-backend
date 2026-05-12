const express = require("express");
const bcrypt = require("bcryptjs");
const {
  ROLE_VALUES,
  isAdminCreatableRole,
  isRole,
  normalizeEmail,
  normalizeName,
} = require("../utils/users");

function createAdminUsersRouter({ prisma }) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const role = req.query.role;

    if (role && !isRole(role)) {
      return res.status(400).json({
        message: `role must be one of: ${ROLE_VALUES.join(", ")}.`,
      });
    }

    const where = role ? { role } : {};
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { id: "asc" },
    });

    res.json(users);
  });

  router.post("/", async (req, res) => {
    const { name, email, password, role } = req.body || {};
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (
      !normalizedName ||
      !normalizedEmail ||
      typeof password !== "string" ||
      password.length === 0 ||
      !role
    ) {
      return res.status(400).json({ message: "name, email, password, role are required." });
    }

    if (!isAdminCreatableRole(role)) {
      return res.status(400).json({ message: "role must be TEACHER or STUDENT." });
    }

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json(user);
  });

  return router;
}

module.exports = { createAdminUsersRouter };
