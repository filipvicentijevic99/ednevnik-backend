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

## Pokretanje projekta (kasnije popuniti)
### Backend
- TODO

### Frontend
- TODO

## Roadmap (kratko)
- [ ] Setup repo + baze + Prisma
- [ ] Auth (JWT) + RBAC
- [ ] Admin CRUD (users/classes/subjects)
- [ ] Assignments + Grades
- [ ] Frontend paneli (Admin/Profesor)
- [ ] Testovi + Deploy