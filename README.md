# Elektronski dnevnik (E-Dnevnik)

Web aplikacija za unos i pregled školskih ocena. Ovaj deo projekta sadrži
Express API, Prisma modele i migracije za PostgreSQL bazu podataka.

## Uloge

- **Administrator (`ADMIN`)**: kreira odeljenja, predmete, profesore i učenike,
  upisuje učenike u odeljenja, dodeljuje zaduženja profesorima i upravlja ocenama.
- **Profesor (`TEACHER`)**: pregleda učenike i unosi, menja ili briše ocene za
  odeljenja i predmete koji su mu dodeljeni.
- **Učenik (`STUDENT`)**: može da se prijavi; pregled sopstvenih ocena je planiran
  za narednu fazu razvoja.

## Implementirane funkcionalnosti

- Prijava pomoću JWT tokena i kontrola pristupa prema ulozi korisnika.
- Kreiranje i pregled korisnika.
- Kreiranje, pregled, izmena i brisanje odeljenja i predmeta.
- Upis učenika u odeljenje i promena odeljenja.
- Dodela profesora odeljenjima i predmetima.
- Pregled dnevnika sa spiskom učenika i unetim ocenama.
- Unos, izmena i brisanje ocena od 1 do 5, sa datumom i opcionom beleškom.

## Tehnologije

- Frontend: Vue 3, Vite, Pinia i Vue Router.
- Backend: Node.js i Express.
- Baza podataka: PostgreSQL i Prisma.
- Autentifikacija: JWT.

## Lokalno pokretanje

Potrebni su Node.js sa podrškom za `--experimental-test-isolation=none` i pokrenut
Docker Desktop. Komande ispod namenjene su PowerShell terminalu i pokreću se
iz direktorijuma `ednevnik-backend`. Koristi se `npm.cmd` da bi komande radile
i kada je izvršavanje `npm.ps1` skripte blokirano.

```powershell
npm.cmd ci
# Kopiraj samo pri prvom podešavanju; sačuvaj postojeći .env.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d
npm.cmd run prisma:generate
npx.cmd prisma migrate deploy
npm.cmd run prisma:seed
npm.cmd run dev
```

API je dostupan na http://localhost:3000. Provera rada servera:
http://localhost:3000/health.

Skripta za početne podatke kreira nalog `admin@ednevnik.local` ili mu ponovo
postavlja lozinku na `Admin123!`. Ove podatke koristi samo za lokalni razvoj.

Nakon preuzimanja novih izmena pokreni `npm.cmd run prisma:generate` i
`npx.cmd prisma migrate deploy` pre pokretanja API-ja. Za pravljenje novih
migracija tokom razvoja koristi `npm run prisma:migrate`.

U kompletnom projektu frontend se nalazi u direktorijumu `../ednevnik-frontend`.
U drugom terminalu, počev od direktorijuma `ednevnik-backend`, pokreni:

```powershell
cd ../ednevnik-frontend
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Otvori http://localhost:5173. Ako si preuzeo samo backend sa grane `main`,
uputstvo za kompletan projekat nalazi se u
[README datoteci na grani master](https://github.com/filipvicentijevic99/ednevnik-backend/blob/master/README.md).

## API za dnevnik

Ovim rutama mogu da pristupe administratori i profesori. Profesori imaju pristup
samo svojim trenutnim zaduženjima, dok administratori imaju pristup svim zaduženjima.

- `GET /gradebook/assignments`: pregled dostupnih zaduženja za odeljenja i predmete.
- `GET /gradebook/assignments/:assignmentId`: trenutni spisak učenika i unete ocene.
- `POST /gradebook/assignments/:assignmentId/grades`: unos ocene uz `studentId`,
  celobrojni `value` (1–5), `gradedOn` (`YYYY-MM-DD`) i opcionu belešku `note`
  (do 500 znakova).
- `PATCH /gradebook/assignments/:assignmentId/grades/:gradeId`: izmena ocene uz
  `value`, `gradedOn` i opcionu belešku `note`. Učenik i prvobitni autor ocene
  ne mogu da se promene kroz ovu rutu.
- `DELETE /gradebook/assignments/:assignmentId/grades/:gradeId`: brisanje ocene.

Za unos nove ocene učenik mora trenutno da bude upisan u izabrano odeljenje.
Postojeće ocene ostaju vezane za prvobitno odeljenje i predmet nakon prelaska
učenika ili promene zaduženja profesora. Brisanje zaduženja ne briše ocene;
ponovna dodela istog odeljenja i predmeta omogućava pristup tim ocenama.
Pokušaj brisanja odeljenja ili predmeta sa ocenama vraća status `409`.

Školske godine, polugodišta i evidencija izmena ocena još nisu implementirani.
Prikazani prosek je informativan i ne predstavlja zaključnu ocenu.

## Provere

Iz direktorijuma `ednevnik-backend` pokreni:

```powershell
npm.cmd test
npm.cmd run test:integration
```

Prva komanda pokreće API testove sa simuliranom bazom. Integracioni testovi
zahtevaju pokrenut PostgreSQL i proveravaju migracije i dozvole za dnevnik na
stvarnoj bazi. Kreiraju privremenu šemu sa nasumičnim imenom i uklanjaju je po
završetku, bez menjanja podataka aplikacije. Korisnik baze mora da ima dozvolu
za kreiranje šema. Promenljiva `TEST_DATABASE_URL`, ako je postavljena, ima
prednost nad vrednošću `DATABASE_URL` iz `.env` datoteke.

## Plan razvoja

- [x] Baza podataka, Prisma migracije, JWT autentifikacija i provera uloga
- [x] Upravljanje korisnicima, odeljenjima, predmetima, upisima i zaduženjima
- [x] Dnevnik za profesore i administratore sa unosom, izmenom i brisanjem ocena
- [x] API testovi i integracioni testovi dnevnika sa PostgreSQL bazom
- [ ] Pregled sopstvenih ocena za učenike, bez mogućnosti izmene
- [ ] Školske godine, polugodišta i pristup arhivi
- [ ] Promena i obnova lozinke, bezbedni početni podaci i ograničavanje pokušaja prijave
- [ ] Evidencija izmena ocena i pravila za zaključivanje ocena
- [ ] Objavljivanje aplikacije i rezervne kopije
