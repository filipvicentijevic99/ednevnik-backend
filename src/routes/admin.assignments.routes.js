const express = require("express");

function isPrismaUniqueConstraintError(error) {
  return error && error.code === "P2002";
}

function isPrismaNotFoundError(error) {
  return error && error.code === "P2025";
}

function toPositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function buildAssignmentPayload(prisma, assignment) {
  const [teacher, schoolClass, subject] = await Promise.all([
    prisma.user.findUnique({
      where: { id: assignment.teacherId },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.schoolClass.findUnique({
      where: { id: assignment.classId },
      select: { id: true, name: true },
    }),
    prisma.subject.findUnique({
      where: { id: assignment.subjectId },
      select: { id: true, name: true },
    }),
  ]);

  return {
    id: assignment.id,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    teacher,
    class: schoolClass,
    subject,
  };
}

async function validateAssignmentReferences(prisma, teacherId, classId, subjectId) {
  const [teacher, schoolClass, subject] = await Promise.all([
    prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    }),
    prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { id: true },
    }),
    prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    }),
  ]);

  if (!teacher || teacher.role !== "TEACHER") {
    return { status: 400, message: "Selected user must be a teacher." };
  }

  if (!schoolClass) {
    return { status: 404, message: "Class not found." };
  }

  if (!subject) {
    return { status: 404, message: "Subject not found." };
  }

  return null;
}

function createAdminAssignmentsRouter({ prisma }) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const assignments = await prisma.teachingAssignment.findMany({
      orderBy: { id: "asc" },
    });

    const payload = await Promise.all(
      assignments.map((assignment) => buildAssignmentPayload(prisma, assignment))
    );

    res.json(payload);
  });

  router.post("/", async (req, res) => {
    const teacherId = toPositiveInteger(req.body?.teacherId);
    const classId = toPositiveInteger(req.body?.classId);
    const subjectId = toPositiveInteger(req.body?.subjectId);

    if (!teacherId || !classId || !subjectId) {
      return res.status(400).json({ message: "teacherId, classId, subjectId are required." });
    }

    const validationError = await validateAssignmentReferences(
      prisma,
      teacherId,
      classId,
      subjectId
    );

    if (validationError) {
      return res.status(validationError.status).json({ message: validationError.message });
    }

    try {
      const assignment = await prisma.teachingAssignment.create({
        data: { teacherId, classId, subjectId },
      });

      res.status(201).json(await buildAssignmentPayload(prisma, assignment));
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        return res.status(409).json({ message: "Assignment already exists." });
      }

      throw error;
    }
  });

  router.patch("/:id", async (req, res) => {
    const id = toPositiveInteger(req.params.id);
    const teacherId = toPositiveInteger(req.body?.teacherId);
    const classId = toPositiveInteger(req.body?.classId);
    const subjectId = toPositiveInteger(req.body?.subjectId);

    if (!id) {
      return res.status(400).json({ message: "Invalid id." });
    }

    if (!teacherId || !classId || !subjectId) {
      return res.status(400).json({ message: "teacherId, classId, subjectId are required." });
    }

    const validationError = await validateAssignmentReferences(
      prisma,
      teacherId,
      classId,
      subjectId
    );

    if (validationError) {
      return res.status(validationError.status).json({ message: validationError.message });
    }

    try {
      const assignment = await prisma.teachingAssignment.update({
        where: { id },
        data: { teacherId, classId, subjectId },
      });

      res.json(await buildAssignmentPayload(prisma, assignment));
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({ message: "Assignment not found." });
      }

      if (isPrismaUniqueConstraintError(error)) {
        return res.status(409).json({ message: "Assignment already exists." });
      }

      throw error;
    }
  });

  router.delete("/:id", async (req, res) => {
    const id = toPositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid id." });
    }

    try {
      await prisma.teachingAssignment.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({ message: "Assignment not found." });
      }

      throw error;
    }
  });

  return router;
}

module.exports = { createAdminAssignmentsRouter };
