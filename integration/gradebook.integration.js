const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readdir, readFile } = require("node:fs/promises");
const path = require("node:path");
const { Client } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");

test("gradebook with PostgreSQL migrations and authorization", async (t) => {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  assert.ok(connectionString, "Set TEST_DATABASE_URL or DATABASE_URL to a local PostgreSQL database.");
  // Each run owns one random schema. Existing application tables are never modified.
  const schema = `gradebook_test_${randomUUID().replaceAll("-", "")}`;
  const client = new Client({ connectionString });
  let prisma;
  let server;
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const migrations = path.join(__dirname, "../prisma/migrations");
    const entries = await readdir(migrations, { withFileTypes: true });
    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      await client.query(await readFile(path.join(migrations, entry.name, "migration.sql"), "utf8"));
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }, { schema }) });
    const makeUser = (name, role) => prisma.user.create({ data: { name, role, email: `${name}@test.local`, passwordHash: "unused" } });
    const admin = await makeUser("admin", "ADMIN");
    const teacher = await makeUser("teacher", "TEACHER");
    const otherTeacher = await makeUser("otherteacher", "TEACHER");
    const student = await makeUser("student", "STUDENT");
    const outsider = await makeUser("outsider", "STUDENT");
    const schoolClass = await prisma.schoolClass.create({ data: { name: "I-1" } });
    const otherClass = await prisma.schoolClass.create({ data: { name: "II-1" } });
    const subject = await prisma.subject.create({ data: { name: "Mathematics" } });
    const otherSubject = await prisma.subject.create({ data: { name: "Physics" } });
    const assignment = await prisma.teachingAssignment.create({ data: { teacherId: teacher.id, classId: schoolClass.id, subjectId: subject.id } });
    const otherAssignment = await prisma.teachingAssignment.create({ data: { teacherId: otherTeacher.id, classId: otherClass.id, subjectId: subject.id } });
    const otherSubjectAssignment = await prisma.teachingAssignment.create({ data: { teacherId: teacher.id, classId: schoolClass.id, subjectId: otherSubject.id } });
    await prisma.studentEnrollment.create({ data: { studentId: student.id, classId: schoolClass.id } });
    await prisma.studentEnrollment.create({ data: { studentId: outsider.id, classId: otherClass.id } });
    const grade = await prisma.grade.create({ data: { studentId: student.id, classId: schoolClass.id, subjectId: subject.id, authorId: teacher.id, value: 4, gradedOn: new Date("2026-09-30") } });
    const secret = randomUUID();
    const app = createApp({ prisma, jwtSecret: secret, frontendOrigin: "http://localhost:5173" });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    async function request(user, route, method = "GET", body) {
      const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${jwt.sign({ sub: String(user.id) }, secret)}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    }
    const base = `/gradebook/assignments/${assignment.id}`;
    const data = { studentId: student.id, value: 5, gradedOn: "2026-09-30", note: "Written assessment" };

    await t.test("anonymous and student accounts cannot access gradebooks", async () => {
      assert.equal((await request(null, "/gradebook/assignments")).status, 401);
      assert.equal((await request(student, "/gradebook/assignments")).status, 403);
      assert.equal((await request(student, `${base}/grades`, "POST", data)).status, 403);
    });
    await t.test("teachers see only their assignments and admins see all", async () => {
      const own = await request(teacher, "/gradebook/assignments");
      assert.equal(own.status, 200);
      assert.deepEqual(own.body.map((item) => item.id), [assignment.id, otherSubjectAssignment.id]);
      assert.equal(own.body[0].teacher.passwordHash, undefined);
      const all = await request(admin, "/gradebook/assignments");
      assert.equal(all.body.length, 3);
    });
    await t.test("roster and grades are limited to the selected class and subject", async () => {
      const result = await request(teacher, base);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.students.map((item) => item.id), [student.id]);
      assert.deepEqual(result.body.grades.map((item) => item.id), [grade.id]);
      assert.equal(result.body.grades[0].student.passwordHash, undefined);
    });
    await t.test("another teacher cannot read, create, edit, or delete through the assignment", async () => {
      assert.equal((await request(otherTeacher, base)).status, 404);
      assert.equal((await request(otherTeacher, `${base}/grades`, "POST", data)).status, 404);
      assert.equal((await request(otherTeacher, `${base}/grades/${grade.id}`, "PATCH", data)).status, 404);
      assert.equal((await request(otherTeacher, `${base}/grades/${grade.id}`, "DELETE")).status, 404);
    });
    await t.test("a valid own assignment cannot be used to modify another class's grade", async () => {
      const otherBase = `/gradebook/assignments/${otherAssignment.id}/grades/${grade.id}`;
      assert.equal((await request(otherTeacher, otherBase, "PATCH", data)).status, 404);
      assert.equal((await request(otherTeacher, otherBase, "DELETE")).status, 404);
      assert.equal((await prisma.grade.findUnique({ where: { id: grade.id } })).value, 4);
    });
    await t.test("creation requires a currently enrolled student", async () => {
      assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, studentId: outsider.id })).status, 400);
      assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, studentId: teacher.id })).status, 400);
    });
    await t.test("grades cannot be accessed through a different subject in the same class", async () => {
      const otherBase = `/gradebook/assignments/${otherSubjectAssignment.id}`;
      assert.deepEqual((await request(teacher, otherBase)).body.grades, []);
      assert.equal((await request(teacher, `${otherBase}/grades/${grade.id}`, "PATCH", data)).status, 404);
      assert.equal((await request(teacher, `${otherBase}/grades/${grade.id}`, "DELETE")).status, 404);
    });
    await t.test("invalid grades, dates, notes and identifiers are rejected", async () => {
      for (const value of [0, 6, 2.5, "5", null]) {
        assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, value })).status, 400);
      }
      for (const gradedOn of ["2026-02-30", "invalid", "2026-9-1"]) {
        assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, gradedOn })).status, 400);
      }
      assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, note: "x".repeat(501) })).status, 400);
      assert.equal((await request(teacher, "/gradebook/assignments/2147483648")).status, 400);
      assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, studentId: true })).status, 400);
      assert.equal((await request(teacher, `${base}/grades`, "POST", { ...data, studentId: [student.id] })).status, 400);
      await assert.rejects(prisma.grade.create({ data: { studentId: student.id, classId: schoolClass.id, subjectId: subject.id, authorId: teacher.id, value: 6, gradedOn: new Date() } }));
    });
    await t.test("teacher can create, edit, and delete a grade; author cannot be forged", async () => {
      const created = await request(teacher, `${base}/grades`, "POST", { ...data, authorId: admin.id });
      assert.equal(created.status, 201);
      assert.equal(created.body.authorId, teacher.id);
      const updated = await request(teacher, `${base}/grades/${created.body.id}`, "PATCH", { ...data, value: 3, studentId: outsider.id });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.value, 3);
      assert.equal(updated.body.studentId, student.id);
      assert.equal((await request(teacher, `${base}/grades/${created.body.id}`, "DELETE")).status, 204);
      assert.equal(await prisma.grade.findUnique({ where: { id: created.body.id } }), null);
      assert.equal((await request(teacher, `${base}/grades/${created.body.id}`, "DELETE")).status, 404);
    });
    await t.test("admin can edit grades and original author is preserved", async () => {
      const result = await request(admin, `${base}/grades/${grade.id}`, "PATCH", { ...data, value: 2 });
      assert.equal(result.status, 200);
      assert.equal(result.body.authorId, teacher.id);
    });
    await t.test("catalog deletion cannot cascade away recorded grades", async () => {
      assert.equal((await request(admin, `/admin/classes/${schoolClass.id}`, "DELETE")).status, 409);
      assert.equal((await request(admin, `/admin/subjects/${subject.id}`, "DELETE")).status, 409);
      assert.ok(await prisma.grade.findUnique({ where: { id: grade.id } }));
    });
    await t.test("moving students preserves old grades and prevents new grades in their former class", async () => {
      await prisma.studentEnrollment.update({ where: { studentId: student.id }, data: { classId: otherClass.id } });
      const result = await request(teacher, base);
      assert.equal(result.body.students.length, 0);
      assert.equal(result.body.grades[0].id, grade.id);
      assert.equal((await request(teacher, `${base}/grades`, "POST", data)).status, 400);
    });
    await t.test("reassigning teaching preserves grades and revokes the previous teacher's access", async () => {
      await prisma.teachingAssignment.update({ where: { id: assignment.id }, data: { teacherId: otherTeacher.id } });
      assert.equal((await request(teacher, base)).status, 404);
      assert.equal((await request(teacher, `${base}/grades/${grade.id}`, "PATCH", data)).status, 404);
      const result = await request(otherTeacher, base);
      assert.equal(result.status, 200);
      assert.equal(result.body.grades[0].id, grade.id);
      await prisma.teachingAssignment.delete({ where: { id: assignment.id } });
      assert.ok(await prisma.grade.findUnique({ where: { id: grade.id } }));
    });
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (prisma) await prisma.$disconnect();
    // Only remove the randomly named test schema created by this run.
    if (/^gradebook_test_[a-f0-9]{32}$/.test(schema)) await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
  }
});
