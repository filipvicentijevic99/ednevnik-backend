# E-Dnevnik

School journal with a Vue frontend, Express API, and PostgreSQL database.

## Repository layout

The `master` branch contains this workspace and the frontend. The backend is a
submodule pointing to the `main` branch of the same GitHub repository.

Clone the complete project:

```sh
git clone --branch master --recurse-submodules https://github.com/filipvicentijevic99/ednevnik-backend.git e-dnevnik
cd e-dnevnik
```

For an existing clone, run `git submodule update --init`.

## Run locally

Use a recent Node.js version that supports `--experimental-test-isolation=none`
and start Docker Desktop. In PowerShell use `npm.cmd` if `npm.ps1` is blocked.

Backend (first terminal):

```powershell
cd ednevnik-backend
npm.cmd ci
# Copy only on first setup; preserve an existing .env.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d
npm.cmd run prisma:generate
npx.cmd prisma migrate deploy
npm.cmd run prisma:seed
npm.cmd run dev
```

The current seed creates or resets `admin@ednevnik.local` with password
`Admin123!`. Use these credentials only for local development.

Frontend (second terminal, starting in the workspace root):

```powershell
cd ednevnik-frontend
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Open http://localhost:5173. The API runs at http://localhost:3000.

## Test the gradebook

1. Sign in as admin and create a class, subject, teacher, and student.
2. Enroll the student in the class and assign the teacher to that class/subject.
3. Open **Gradebook** as admin, or log in with the teacher's credentials.
4. Choose the assignment, record a grade from 1–5 with a date and optional note,
   then try editing or deleting it.

Teachers only see their assignments. Admins can manage all assigned gradebooks.
Recorded grades remain attached to their original class and subject when a
student moves or a teaching assignment changes. Classes and subjects with grades
cannot be deleted. Averages are informational; no final-grade calculation is defined.

## Checks

From `ednevnik-backend`:

```powershell
npm.cmd test
npm.cmd run test:integration
```

Integration tests require PostgreSQL and use a temporary, randomly named schema
that is removed afterward. They do not change application records. Set
`TEST_DATABASE_URL` to use a separate test database; otherwise they use the local
`DATABASE_URL` from `.env`. The database user needs permission to create schemas.

From `ednevnik-frontend`, run `npm.cmd run build`.

## Remaining milestones

- Student read-only grade view.
- School years, terms, and archive access before using the journal across years.
- Password changes/reset, safe initial admin provisioning, and login throttling.
- Grade edit/deletion audit history and final-grade rules.
- Deployment, backups, and browser end-to-end coverage.

## Committing backend changes

Commit and push inside `ednevnik-backend` first. Then commit its updated submodule
pointer together with frontend changes in the workspace root and push `master`.
Both branches are required to retrieve the complete project.
