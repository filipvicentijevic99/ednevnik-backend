const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ednevnik-backend" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

const { authRouter } = require("./routes/auth.routes");
const { requireAuth } = require("./middlewares/requireAuth");

app.use("/auth", authRouter);

app.get("/me", requireAuth, (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  });
});

const { requireRole } = require("./middlewares/requireRole");

app.get("/admin-only", requireAuth, requireRole("ADMIN"), (req, res) => {
  res.json({ ok: true, message: "Welcome admin!" });
});

const { adminUsersRouter } = require("./routes/admin.users.routes");

app.use("/admin/users", requireAuth, requireRole("ADMIN"), adminUsersRouter);