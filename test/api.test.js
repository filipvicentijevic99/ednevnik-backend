const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { createApp } = require("../src/app");

const TEST_JWT_SECRET = "test-secret";

function applySelect(record, select) {
  if (!record || !select) {
    return record ? { ...record } : record;
  }

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled)
      .map(([key]) => [key, record[key]])
  );
}

function createPrismaError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function createCatalogDelegate(seedRecords = []) {
  const records = seedRecords.map((record) => ({ ...record }));
  let nextId = records.reduce((max, record) => Math.max(max, record.id), 0) + 1;

  return {
    async findUnique({ where, select }) {
      const record = records.find((candidate) => candidate.id === where.id);
      return applySelect(record, select);
    },

    async findMany({ select, orderBy } = {}) {
      let results = records.map((record) => ({ ...record }));

      if (orderBy && orderBy.id === "asc") {
        results = results.sort((left, right) => left.id - right.id);
      }

      return results.map((record) => applySelect(record, select));
    },

    async create({ data, select }) {
      const normalizedName = data.name;
      const exists = records.find((record) => record.name === normalizedName);

      if (exists) {
        throw createPrismaError("P2002");
      }

      const timestamp = new Date().toISOString();
      const record = {
        id: nextId++,
        name: normalizedName,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      records.push(record);

      return applySelect(record, select);
    },

    async update({ where, data, select }) {
      const record = records.find((candidate) => candidate.id === where.id);

      if (!record) {
        throw createPrismaError("P2025");
      }

      const duplicate = records.find(
        (candidate) => candidate.id !== where.id && candidate.name === data.name
      );

      if (duplicate) {
        throw createPrismaError("P2002");
      }

      record.name = data.name;
      record.updatedAt = new Date().toISOString();

      return applySelect(record, select);
    },

    async delete({ where }) {
      const index = records.findIndex((candidate) => candidate.id === where.id);

      if (index === -1) {
        throw createPrismaError("P2025");
      }

      records.splice(index, 1);
    },
  };
}

function createEnrollmentDelegate(seedRecords = []) {
  const records = seedRecords.map((record) => ({ ...record }));
  let nextId = records.reduce((max, record) => Math.max(max, record.id), 0) + 1;

  return {
    async findMany({ orderBy } = {}) {
      let results = records.map((record) => ({ ...record }));

      if (orderBy && orderBy.id === "asc") {
        results = results.sort((left, right) => left.id - right.id);
      }

      return results;
    },

    async create({ data }) {
      const existing = records.find((record) => record.studentId === data.studentId);

      if (existing) {
        throw createPrismaError("P2002");
      }

      const timestamp = new Date().toISOString();
      const record = {
        id: nextId++,
        studentId: data.studentId,
        classId: data.classId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      records.push(record);
      return { ...record };
    },

    async update({ where, data }) {
      const record = records.find((candidate) => candidate.id === where.id);

      if (!record) {
        throw createPrismaError("P2025");
      }

      record.classId = data.classId;
      record.updatedAt = new Date().toISOString();

      return { ...record };
    },

    async delete({ where }) {
      const index = records.findIndex((candidate) => candidate.id === where.id);

      if (index === -1) {
        throw createPrismaError("P2025");
      }

      records.splice(index, 1);
    },
  };
}

function createTeachingAssignmentDelegate(seedRecords = []) {
  const records = seedRecords.map((record) => ({ ...record }));
  let nextId = records.reduce((max, record) => Math.max(max, record.id), 0) + 1;

  return {
    async findMany({ orderBy } = {}) {
      let results = records.map((record) => ({ ...record }));

      if (orderBy && orderBy.id === "asc") {
        results = results.sort((left, right) => left.id - right.id);
      }

      return results;
    },

    async create({ data }) {
      const duplicate = records.find(
        (record) =>
          record.teacherId === data.teacherId &&
          record.classId === data.classId &&
          record.subjectId === data.subjectId
      );

      if (duplicate) {
        throw createPrismaError("P2002");
      }

      const timestamp = new Date().toISOString();
      const record = {
        id: nextId++,
        teacherId: data.teacherId,
        classId: data.classId,
        subjectId: data.subjectId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      records.push(record);
      return { ...record };
    },

    async update({ where, data }) {
      const record = records.find((candidate) => candidate.id === where.id);

      if (!record) {
        throw createPrismaError("P2025");
      }

      const duplicate = records.find(
        (candidate) =>
          candidate.id !== where.id &&
          candidate.teacherId === data.teacherId &&
          candidate.classId === data.classId &&
          candidate.subjectId === data.subjectId
      );

      if (duplicate) {
        throw createPrismaError("P2002");
      }

      record.teacherId = data.teacherId;
      record.classId = data.classId;
      record.subjectId = data.subjectId;
      record.updatedAt = new Date().toISOString();

      return { ...record };
    },

    async delete({ where }) {
      const index = records.findIndex((candidate) => candidate.id === where.id);

      if (index === -1) {
        throw createPrismaError("P2025");
      }

      records.splice(index, 1);
    },
  };
}

function createPrismaStub(seed = {}) {
  const seedData = Array.isArray(seed) ? { users: seed } : seed;
  const users = (seedData.users || []).map((user) => ({ ...user }));
  let nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;

  return {
    user: {
      async findUnique({ where, select }) {
        const user = users.find((candidate) => {
          if (where.id != null) {
            return candidate.id === where.id;
          }

          if (where.email != null) {
            return candidate.email === where.email;
          }

          return false;
        });

        return applySelect(user, select);
      },

      async findMany({ where = {}, select, orderBy }) {
        let results = users.filter((user) => {
          if (where.role) {
            return user.role === where.role;
          }

          return true;
        });

        if (orderBy && orderBy.id === "asc") {
          results = results.sort((left, right) => left.id - right.id);
        }

        return results.map((user) => applySelect(user, select));
      },

      async create({ data, select }) {
        const createdAt = new Date().toISOString();
        const user = {
          id: nextId++,
          createdAt,
          updatedAt: createdAt,
          ...data,
        };

        users.push(user);

        return applySelect(user, select);
      },
    },
    schoolClass: createCatalogDelegate(seedData.classes || []),
    subject: createCatalogDelegate(seedData.subjects || []),
    studentEnrollment: createEnrollmentDelegate(seedData.enrollments || []),
    teachingAssignment: createTeachingAssignmentDelegate(seedData.assignments || []),
  };
}

async function createTestApp(seedData) {
  const prisma = createPrismaStub(seedData);
  const app = createApp({
    prisma,
    jwtSecret: TEST_JWT_SECRET,
    frontendOrigin: "http://localhost:5173",
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    async request(path, options = {}) {
      const response = await fetch(`${baseUrl}${path}`, options);
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      return { response, payload };
    },
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}

test("POST /auth/login normalizes email and returns a token", async () => {
  const passwordHash = await bcrypt.hash("Admin123!", 4);
  const app = await createTestApp([
    {
      id: 1,
      name: "Admin",
      email: "admin@ednevnik.local",
      passwordHash,
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const { response, payload } = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "  ADMIN@EDNEVNIK.LOCAL ",
        password: "Admin123!",
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(payload.user.email, "admin@ednevnik.local");
    assert.ok(payload.accessToken);
  } finally {
    await app.close();
  }
});

test("GET /me loads the current user from the database", async () => {
  const app = await createTestApp([
    {
      id: 7,
      name: "Teacher",
      email: "teacher@ednevnik.local",
      passwordHash: "unused",
      role: "TEACHER",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const token = jwt.sign({ sub: "7", role: "ADMIN" }, TEST_JWT_SECRET, {
      expiresIn: "2h",
    });

    const { response, payload } = await app.request("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    assert.equal(payload.user.role, "TEACHER");
    assert.equal(payload.user.email, "teacher@ednevnik.local");
  } finally {
    await app.close();
  }
});

test("GET /admin/users rejects a stale admin token when the DB role is not admin", async () => {
  const app = await createTestApp([
    {
      id: 3,
      name: "Teacher",
      email: "teacher@ednevnik.local",
      passwordHash: "unused",
      role: "TEACHER",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const token = jwt.sign({ sub: "3", role: "ADMIN" }, TEST_JWT_SECRET, {
      expiresIn: "2h",
    });

    const { response, payload } = await app.request("/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Forbidden.");
  } finally {
    await app.close();
  }
});

test("GET /admin/users returns 400 for an invalid role query", async () => {
  const app = await createTestApp([
    {
      id: 1,
      name: "Admin",
      email: "admin@ednevnik.local",
      passwordHash: "unused",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, {
      expiresIn: "2h",
    });

    const { response, payload } = await app.request("/admin/users?role=PRINCIPAL", {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 400);
    assert.match(payload.message, /role must be one of/i);
  } finally {
    await app.close();
  }
});

test("GET /me returns 401 for an invalid token", async () => {
  const app = await createTestApp([]);

  try {
    const { response, payload } = await app.request("/me", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Invalid or expired token.");
  } finally {
    await app.close();
  }
});

test("POST /admin/users normalizes email before duplicate checks", async () => {
  const app = await createTestApp([
    {
      id: 1,
      name: "Admin",
      email: "admin@ednevnik.local",
      passwordHash: "unused",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Existing Teacher",
      email: "teacher@school.local",
      passwordHash: "unused",
      role: "TEACHER",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, {
      expiresIn: "2h",
    });

    const { response, payload } = await app.request("/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "New Teacher",
        email: " TEACHER@SCHOOL.LOCAL ",
        password: "secret",
        role: "TEACHER",
      }),
    });

    assert.equal(response.status, 409);
    assert.equal(payload.message, "Email already exists.");
  } finally {
    await app.close();
  }
});

test("GET /admin/classes returns the class catalog for admins", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 2, name: "II-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 1, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/classes", {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(
      payload.map((item) => item.name),
      ["I-1", "II-1"]
    );
  } finally {
    await app.close();
  }
});

test("POST /admin/classes trims whitespace and rejects duplicates", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 1, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });

    const first = await app.request("/admin/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "  II-3  " }),
    });

    assert.equal(first.response.status, 201);
    assert.equal(first.payload.name, "II-3");

    const duplicate = await app.request("/admin/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "I-1" }),
    });

    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.payload.message, "Class already exists.");
  } finally {
    await app.close();
  }
});

test("PATCH /admin/classes returns 404 when the class does not exist", async () => {
  const app = await createTestApp([
    {
      id: 1,
      name: "Admin",
      email: "admin@ednevnik.local",
      passwordHash: "unused",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/classes/999", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "III-2" }),
    });

    assert.equal(response.status, 404);
    assert.equal(payload.message, "Class not found.");
  } finally {
    await app.close();
  }
});

test("DELETE /admin/classes removes an existing class", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 1, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const deletion = await app.request("/admin/classes/1", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(deletion.response.status, 204);
    assert.equal(deletion.payload, "");

    const afterDelete = await app.request("/admin/classes", {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.deepEqual(afterDelete.payload, []);
  } finally {
    await app.close();
  }
});

test("POST /admin/subjects requires a subject name", async () => {
  const app = await createTestApp([
    {
      id: 1,
      name: "Admin",
      email: "admin@ednevnik.local",
      passwordHash: "unused",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "   " }),
    });

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Subject name is required.");
  } finally {
    await app.close();
  }
});

test("PATCH /admin/subjects updates the subject name", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
    ],
    subjects: [
      {
        id: 1,
        name: "Mathematics",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/subjects/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Advanced Mathematics" }),
    });

    assert.equal(response.status, 200);
    assert.equal(payload.name, "Advanced Mathematics");
  } finally {
    await app.close();
  }
});

test("POST /admin/enrollments creates an enrollment for a student", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Student One",
        email: "student1@school.local",
        passwordHash: "unused",
        role: "STUDENT",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 10, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/enrollments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId: 2, classId: 10 }),
    });

    assert.equal(response.status, 201);
    assert.equal(payload.student.email, "student1@school.local");
    assert.equal(payload.class.name, "I-1");
  } finally {
    await app.close();
  }
});

test("POST /admin/enrollments rejects non-student users", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Teacher",
        email: "teacher@school.local",
        passwordHash: "unused",
        role: "TEACHER",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 10, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/enrollments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId: 3, classId: 10 }),
    });

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Selected user must be a student.");
  } finally {
    await app.close();
  }
});

test("PATCH /admin/enrollments moves a student to another class", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Student One",
        email: "student1@school.local",
        passwordHash: "unused",
        role: "STUDENT",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 10, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 11, name: "I-2", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    enrollments: [
      { id: 20, studentId: 2, classId: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/enrollments/20", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ classId: 11 }),
    });

    assert.equal(response.status, 200);
    assert.equal(payload.class.name, "I-2");
  } finally {
    await app.close();
  }
});

test("POST /admin/assignments creates a teaching assignment", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: "Teacher One",
        email: "teacher1@school.local",
        passwordHash: "unused",
        role: "TEACHER",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 10, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    subjects: [
      { id: 7, name: "Mathematics", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId: 5, classId: 10, subjectId: 7 }),
    });

    assert.equal(response.status, 201);
    assert.equal(payload.teacher.email, "teacher1@school.local");
    assert.equal(payload.subject.name, "Mathematics");
  } finally {
    await app.close();
  }
});

test("POST /admin/assignments rejects non-teacher users", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      {
        id: 6,
        name: "Student One",
        email: "student1@school.local",
        passwordHash: "unused",
        role: "STUDENT",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 10, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    subjects: [
      { id: 7, name: "Mathematics", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId: 6, classId: 10, subjectId: 7 }),
    });

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Selected user must be a teacher.");
  } finally {
    await app.close();
  }
});

test("PATCH /admin/assignments updates an existing assignment", async () => {
  const app = await createTestApp({
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@ednevnik.local",
        passwordHash: "unused",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: "Teacher One",
        email: "teacher1@school.local",
        passwordHash: "unused",
        role: "TEACHER",
        createdAt: new Date().toISOString(),
      },
      {
        id: 8,
        name: "Teacher Two",
        email: "teacher2@school.local",
        passwordHash: "unused",
        role: "TEACHER",
        createdAt: new Date().toISOString(),
      },
    ],
    classes: [
      { id: 10, name: "I-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 11, name: "I-2", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    subjects: [
      { id: 7, name: "Mathematics", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 9, name: "Physics", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    assignments: [
      { id: 30, teacherId: 5, classId: 10, subjectId: 7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  });

  try {
    const token = jwt.sign({ sub: "1" }, TEST_JWT_SECRET, { expiresIn: "2h" });
    const { response, payload } = await app.request("/admin/assignments/30", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId: 8, classId: 11, subjectId: 9 }),
    });

    assert.equal(response.status, 200);
    assert.equal(payload.teacher.email, "teacher2@school.local");
    assert.equal(payload.class.name, "I-2");
    assert.equal(payload.subject.name, "Physics");
  } finally {
    await app.close();
  }
});
