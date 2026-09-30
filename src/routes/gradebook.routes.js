const express = require("express");

const personSelect = { id: true, name: true, email: true };
const assignmentInclude = {
  schoolClass: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  teacher: { select: personSelect },
};
const gradeInclude = {
  student: { select: personSelect },
  author: { select: personSelect },
};

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function parseId(value) {
  if (!["number", "string"].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || Number(value) > 2147483647) {
    fail(400, "Invalid id.");
  }
  return Number(value);
}

function gradeData(body = {}) {
  if (!Number.isInteger(body.value) || body.value < 1 || body.value > 5) {
    fail(400, "Grade must be a whole number from 1 to 5.");
  }
  if (typeof body.note !== "undefined" && typeof body.note !== "string") {
    fail(400, "Note must be text.");
  }
  const note = (body.note || "").trim();
  if (note.length > 500) fail(400, "Note must be at most 500 characters.");
  const day = body.gradedOn;
  const date = typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day)
    ? new Date(`${day}T00:00:00.000Z`) : new Date(NaN);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
    fail(400, "Choose a valid grading date (YYYY-MM-DD).");
  }
  return { value: body.value, note, gradedOn: date };
}

async function loadAssignment(db, user, id) {
  const assignment = await db.teachingAssignment.findFirst({
    where: { id, ...(user.role === "ADMIN" ? {} : { teacherId: user.id }) },
    include: assignmentInclude,
  });
  if (!assignment) fail(404, "Assignment not found.");
  return assignment;
}

function scope(assignment) {
  return { classId: assignment.classId, subjectId: assignment.subjectId };
}

function createGradebookRouter({ prisma }) {
  const router = express.Router();

  router.get("/assignments", async (req, res) => {
    const assignments = await prisma.teachingAssignment.findMany({
      where: req.user.role === "ADMIN" ? {} : { teacherId: req.user.id },
      include: assignmentInclude,
      orderBy: { id: "asc" },
    });
    res.json(assignments);
  });

  router.get("/assignments/:assignmentId", async (req, res) => {
    const id = parseId(req.params.assignmentId);
    const payload = await prisma.$transaction(async (db) => {
      const assignment = await loadAssignment(db, req.user, id);
      const enrollments = await db.studentEnrollment.findMany({
        where: { classId: assignment.classId },
        include: { student: { select: personSelect } },
        orderBy: { student: { name: "asc" } },
      });
      const grades = await db.grade.findMany({
        where: scope(assignment),
        include: gradeInclude,
        orderBy: [{ gradedOn: "desc" }, { id: "desc" }],
      });
      return { assignment, students: enrollments.map((item) => item.student), grades };
    }, { isolationLevel: "RepeatableRead" });
    res.json(payload);
  });

  router.post("/assignments/:assignmentId/grades", async (req, res) => {
    const id = parseId(req.params.assignmentId);
    const studentId = parseId(req.body?.studentId);
    const data = gradeData(req.body);
    const grade = await prisma.$transaction(async (db) => {
      const assignment = await loadAssignment(db, req.user, id);
      const enrollment = await db.studentEnrollment.findFirst({
        where: { studentId, classId: assignment.classId, student: { role: "STUDENT" } },
      });
      if (!enrollment) fail(400, "Student must be enrolled in this class.");
      return db.grade.create({
        data: { ...data, ...scope(assignment), studentId, authorId: req.user.id },
        include: gradeInclude,
      });
    }, { isolationLevel: "Serializable" });
    res.status(201).json(grade);
  });

  router.patch("/assignments/:assignmentId/grades/:gradeId", async (req, res) => {
    const assignmentId = parseId(req.params.assignmentId);
    const gradeId = parseId(req.params.gradeId);
    const data = gradeData(req.body);
    const grade = await prisma.$transaction(async (db) => {
      const assignment = await loadAssignment(db, req.user, assignmentId);
      const existing = await db.grade.findFirst({ where: { id: gradeId, ...scope(assignment) } });
      if (!existing) fail(404, "Grade not found.");
      return db.grade.update({ where: { id: gradeId }, data, include: gradeInclude });
    }, { isolationLevel: "Serializable" });
    res.json(grade);
  });

  router.delete("/assignments/:assignmentId/grades/:gradeId", async (req, res) => {
    const assignmentId = parseId(req.params.assignmentId);
    const gradeId = parseId(req.params.gradeId);
    await prisma.$transaction(async (db) => {
      const assignment = await loadAssignment(db, req.user, assignmentId);
      const existing = await db.grade.findFirst({ where: { id: gradeId, ...scope(assignment) } });
      if (!existing) fail(404, "Grade not found.");
      await db.grade.delete({ where: { id: gradeId } });
    }, { isolationLevel: "Serializable" });
    res.status(204).send();
  });

  router.use((error, req, res, next) => {
    if (["P2034", "P2003", "P2025"].includes(error.code)) {
      return res.status(409).json({ message: "The record changed. Refresh the gradebook and try again." });
    }
    next(error);
  });
  return router;
}

module.exports = { createGradebookRouter };
