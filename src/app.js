const express = require("express");
const cors = require("cors");

const { createAdminAssignmentsRouter } = require("./routes/admin.assignments.routes");
const { createAuthRouter } = require("./routes/auth.routes");
const { createAdminCatalogRouter } = require("./routes/admin.catalog.routes");
const { createAdminEnrollmentsRouter } = require("./routes/admin.enrollments.routes");
const { createAdminUsersRouter } = require("./routes/admin.users.routes");
const { createRequireAuth } = require("./middlewares/requireAuth");
const { requireRole } = require("./middlewares/requireRole");

function createApp({ prisma, jwtSecret, frontendOrigin }) {
  const app = express();
  const requireAuth = createRequireAuth({ prisma, jwtSecret });

  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ ok: true, service: "ednevnik-backend" });
  });

  app.use("/auth", createAuthRouter({ prisma, jwtSecret }));

  app.get("/me", requireAuth, (req, res) => {
    res.json({
      ok: true,
      user: req.user,
    });
  });

  app.get("/admin-only", requireAuth, requireRole("ADMIN"), (req, res) => {
    res.json({ ok: true, message: "Welcome admin!" });
  });

  app.use(
    "/admin/users",
    requireAuth,
    requireRole("ADMIN"),
    createAdminUsersRouter({ prisma })
  );

  app.use(
    "/admin/classes",
    requireAuth,
    requireRole("ADMIN"),
    createAdminCatalogRouter({
      delegate: prisma.schoolClass,
      entityLabel: "Class",
      emptyNameMessage: "Class name is required.",
    })
  );

  app.use(
    "/admin/subjects",
    requireAuth,
    requireRole("ADMIN"),
    createAdminCatalogRouter({
      delegate: prisma.subject,
      entityLabel: "Subject",
      emptyNameMessage: "Subject name is required.",
    })
  );

  app.use(
    "/admin/enrollments",
    requireAuth,
    requireRole("ADMIN"),
    createAdminEnrollmentsRouter({ prisma })
  );

  app.use(
    "/admin/assignments",
    requireAuth,
    requireRole("ADMIN"),
    createAdminAssignmentsRouter({ prisma })
  );

  app.use((err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(err.status || 500).json({
      message: err.message || "Internal server error.",
    });
  });

  return app;
}

module.exports = { createApp };
