const jwt = require("jsonwebtoken");
const { selectPublicUser } = require("../utils/users");

function createRequireAuth({ prisma, jwtSecret }) {
  return async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      const userId = Number(payload.sub);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }

      req.user = selectPublicUser(user);
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  };
}

module.exports = { createRequireAuth };
