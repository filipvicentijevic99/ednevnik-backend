# Elektronski dnevnik (E-Dnevnik)

Web aplikacija za upis i pregled ocena u školi.
Frontend: Vue.js
Backend: Node.js
Baza: PostgreSQL (Prisma)

## Uloge
- **Admin**: kreira odeljenja, predmete, profesore i učenike, dodeljuje profesore predmetima/odeljenjima
- **Profesor**: unosi i menja ocene za dodeljena odeljenja/predmete
- (Opcionalno) **Učenik/Roditelj**: read-only pregled ocena

## Glavne funkcionalnosti (MVP)
- Login + role-based access (ADMIN, TEACHER)
- Admin panel:
  - CRUD odeljenja
  - CRUD predmeta
  - kreiranje korisnika (profesor/učenik)
  - upis učenika u odeljenje
  - dodela profesora (odeljenje + predmet)
- Profesor panel:
  - pregled svojih dodela
  - pregled dnevnika (odeljenje + predmet)
  - unos/izmena/brisanje ocene

## Pravila i dozvole
- Profesor može da upravlja ocenama samo za **odeljenja/predmete koji su mu dodeljeni**
- Admin ima pun pristup

## Tech stack
- Vue 3 + Vite + Pinia + Vue Router
- Node.js + Express (ili NestJS)
- PostgreSQL + Prisma
- JWT autentifikacija

## Pokretanje projekta
### Backend
- Kopiraj `.env.example` u `.env`
- Pokreni PostgreSQL:
  - `docker compose up -d`
- Primeni migracije:
  - `npm run prisma:migrate`
- Ubaci seed admin korisnika:
  - `npm run prisma:seed`
- Pokreni API:
  - `npm run dev`

### Frontend
- Frontend se nalazi u `../ednevnik-frontend`
- Pokretanje:
  - `npm install`
  - `npm run dev`

## Gradebook API

Admins and teachers can access these routes. Teachers are restricted to their
current teaching assignments; admins can access all assignments.

- `GET /gradebook/assignments`: available class/subject assignments.
- `GET /gradebook/assignments/:assignmentId`: current roster and recorded grades.
- `POST /gradebook/assignments/:assignmentId/grades`: create a grade with
  `studentId`, integer `value` (1–5), `gradedOn` (`YYYY-MM-DD`), and optional `note`
  (up to 500 characters).
- `PATCH /gradebook/assignments/:assignmentId/grades/:gradeId`: supply `value`,
  `gradedOn`, and optional `note` to edit a grade. Student and original author
  cannot be changed through this endpoint.
- `DELETE /gradebook/assignments/:assignmentId/grades/:gradeId`: delete a grade.

New grades require a current enrollment. Existing grades stay with their
original class and subject after transfers or assignment changes. Deleting an
assignment does not delete grades; restoring a matching class/subject assignment
makes those grades accessible again. Class/subject deletion returns `409` if
grades exist. There is no school-year/term model or grade audit history yet.

## Verification

Run `npm test` for the API stub tests. Run `npm run test:integration` with local
PostgreSQL running to exercise all migrations and gradebook permissions against
a real database. Integration tests create and remove a random schema, leaving
application records untouched. `TEST_DATABASE_URL` overrides the `.env`
`DATABASE_URL` for these tests.

After pulling changes, run `npm run prisma:generate` and
`npx prisma migrate deploy` before starting the API.

## Roadmap

- [x] Database, Prisma migrations, JWT authentication, and role checks
- [x] Admin users, classes, subjects, enrollments, and teaching assignments
- [x] Teacher/admin gradebook with grade creation, editing, and deletion
- [x] API tests and PostgreSQL gradebook integration tests
- [ ] Student read-only grades
- [ ] School years, terms, and archive access
- [ ] Password lifecycle, safe seeding, and login throttling
- [ ] Grade audit history and final-grade rules
- [ ] Deployment and backups
