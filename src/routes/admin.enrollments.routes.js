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

async function buildEnrollmentPayload(prisma, enrollment) {
  const [student, schoolClass] = await Promise.all([
    prisma.user.findUnique({
      where: { id: enrollment.studentId },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.schoolClass.findUnique({
      where: { id: enrollment.classId },
      select: { id: true, name: true },
    }),
  ]);

  return {
    id: enrollment.id,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    student,
    class: schoolClass,
  };
}

function createAdminEnrollmentsRouter({ prisma }) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const enrollments = await prisma.studentEnrollment.findMany({
      orderBy: { id: "asc" },
    });

    const payload = await Promise.all(
      enrollments.map((enrollment) => buildEnrollmentPayload(prisma, enrollment))
    );

    res.json(payload);
  });

  router.post("/", async (req, res) => {
    const studentId = toPositiveInteger(req.body?.studentId);
    const classId = toPositiveInteger(req.body?.classId);

    if (!studentId || !classId) {
      return res.status(400).json({ message: "studentId and classId are required." });
    }

    const [student, schoolClass] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true },
      }),
      prisma.schoolClass.findUnique({
        where: { id: classId },
        select: { id: true },
      }),
    ]);

    if (!student || student.role !== "STUDENT") {
      return res.status(400).json({ message: "Selected user must be a student." });
    }

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found." });
    }

    try {
      const enrollment = await prisma.studentEnrollment.create({
        data: { studentId, classId },
      });

      res.status(201).json(await buildEnrollmentPayload(prisma, enrollment));
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        return res.status(409).json({ message: "Student is already enrolled in a class." });
      }

      throw error;
    }
  });

  router.patch("/:id", async (req, res) => {
    const id = toPositiveInteger(req.params.id);
    const classId = toPositiveInteger(req.body?.classId);

    if (!id) {
      return res.status(400).json({ message: "Invalid id." });
    }

    if (!classId) {
      return res.status(400).json({ message: "classId is required." });
    }

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { id: true },
    });

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found." });
    }

    try {
      const enrollment = await prisma.studentEnrollment.update({
        where: { id },
        data: { classId },
      });

      res.json(await buildEnrollmentPayload(prisma, enrollment));
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({ message: "Enrollment not found." });
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
      await prisma.studentEnrollment.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({ message: "Enrollment not found." });
      }

      throw error;
    }
  });

  return router;
}

module.exports = { createAdminEnrollmentsRouter };
