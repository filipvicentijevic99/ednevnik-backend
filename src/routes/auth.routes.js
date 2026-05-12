const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { normalizeEmail, selectPublicUser } = require("../utils/users");

function createAuthRouter({ prisma, jwtSecret }) {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== "string" || password.length === 0) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ sub: String(user.id) }, jwtSecret, { expiresIn: "2h" });

    res.json({
      accessToken: token,
      user: selectPublicUser(user),
    });
  });

  return router;
}

module.exports = { createAuthRouter };
