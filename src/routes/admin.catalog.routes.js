const express = require("express");

const {
  createDuplicateErrorMessage,
  normalizeCatalogName,
} = require("../utils/catalog");

function isPrismaNotFoundError(error) {
  return error && error.code === "P2025";
}

function isPrismaUniqueConstraintError(error) {
  return error && error.code === "P2002";
}

function createAdminCatalogRouter({
  delegate,
  entityLabel,
  emptyNameMessage,
  duplicateNameMessage = createDuplicateErrorMessage(entityLabel),
  notFoundMessage = `${entityLabel} not found.`,
}) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const records = await delegate.findMany({
      select: { id: true, name: true, createdAt: true, updatedAt: true },
      orderBy: { id: "asc" },
    });

    res.json(records);
  });

  router.post("/", async (req, res) => {
    const name = normalizeCatalogName(req.body?.name);

    if (!name) {
      return res.status(400).json({ message: emptyNameMessage });
    }

    try {
      const record = await delegate.create({
        data: { name },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      });

      return res.status(201).json(record);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        return res.status(409).json({ message: duplicateNameMessage });
      }

      throw error;
    }
  });

  router.patch("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const name = normalizeCatalogName(req.body?.name);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id." });
    }

    if (!name) {
      return res.status(400).json({ message: emptyNameMessage });
    }

    try {
      const record = await delegate.update({
        where: { id },
        data: { name },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      });

      return res.json(record);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({ message: notFoundMessage });
      }

      if (isPrismaUniqueConstraintError(error)) {
        return res.status(409).json({ message: duplicateNameMessage });
      }

      throw error;
    }
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id." });
    }

    try {
      await delegate.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({ message: notFoundMessage });
      }

      throw error;
    }
  });

  return router;
}

module.exports = { createAdminCatalogRouter };
