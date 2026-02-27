const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../db/prisma");

const router = express.Router();

// GET /admin/users?role=TEACHER
router.get("/", async (req, res) => {
  const role = req.query.role;

  const where = role ? { role } : {};
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { id: "asc" },
  });

  res.json(users);
});

// POST /admin/users
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password, role are required." });
  }

  if (!["TEACHER", "STUDENT"].includes(role)) {
    return res.status(400).json({ message: "role must be TEACHER or STUDENT." });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already exists." });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json(user);
});

module.exports = { adminUsersRouter: router };