CREATE TABLE "Grade" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "note" VARCHAR(500) NOT NULL DEFAULT '',
    "gradedOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Grade_value_check" CHECK ("value" BETWEEN 1 AND 5),
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grade_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Grade_classId_subjectId_studentId_idx" ON "Grade"("classId", "subjectId", "studentId");
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");
CREATE INDEX "Grade_authorId_idx" ON "Grade"("authorId");
CREATE INDEX "Grade_subjectId_idx" ON "Grade"("subjectId");
