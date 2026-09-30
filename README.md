# E-Dnevnik

Web aplikacija za unos i pregled školskih ocena, sa Vue korisničkim interfejsom,
Express API-jem i PostgreSQL bazom podataka.

## Struktura repozitorijuma

Grana `master` sadrži ovaj radni prostor i frontend. Backend je Git podmodul
koji prati granu `main` istog GitHub repozitorijuma.

Kloniranje kompletnog projekta:

```sh
git clone --branch master --recurse-submodules https://github.com/filipvicentijevic99/ednevnik-backend.git e-dnevnik
cd e-dnevnik
```

Ako je repozitorijum već kloniran, pokreni `git submodule update --init`.

## Lokalno pokretanje

Potrebni su Node.js sa podrškom za `--experimental-test-isolation=none` i pokrenut
Docker Desktop. U PowerShell terminalu koristi `npm.cmd` ako je `npm.ps1` blokiran.

Backend (prvi terminal, iz korena projekta):

```powershell
cd ednevnik-backend
npm.cmd ci
# Kopiraj samo pri prvom podešavanju; sačuvaj postojeći .env.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d
npm.cmd run prisma:generate
npx.cmd prisma migrate deploy
npm.cmd run prisma:seed
npm.cmd run dev
```

Trenutna skripta za početne podatke kreira nalog `admin@ednevnik.local` ili mu
ponovo postavlja lozinku na `Admin123!`. Ove podatke koristi samo za lokalni razvoj.

Frontend (drugi terminal, iz korena projekta):

```powershell
cd ednevnik-frontend
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Otvori http://localhost:5173. API je dostupan na http://localhost:3000.

## Isprobavanje dnevnika

1. Prijavi se kao administrator i kreiraj odeljenje, predmet, profesora i učenika.
2. Upiši učenika u odeljenje i dodeli profesoru odeljenje i predmet.
3. Otvori **Gradebook** kao administrator ili se prijavi pomoću naloga profesora.
4. Izaberi dodeljeno odeljenje i predmet, unesi ocenu od 1 do 5 sa datumom i
   opcionom beleškom, pa isprobaj izmenu ili brisanje ocene.

Profesori vide samo svoja zaduženja. Administratori mogu da upravljaju dnevnicima
za sva dodeljena odeljenja i predmete. Unete ocene ostaju vezane za prvobitno
odeljenje i predmet kada učenik promeni odeljenje ili se promeni zaduženje
profesora. Odeljenja i predmeti sa unetim ocenama ne mogu da se obrišu. Prikazani
prosek je informativan; pravila za zaključivanje ocena još nisu definisana.

## Provere

Iz direktorijuma `ednevnik-backend`:

```powershell
npm.cmd test
npm.cmd run test:integration
```

Integracioni testovi zahtevaju PostgreSQL i koriste privremenu šemu sa nasumičnim
imenom, koja se nakon testa uklanja. Ne menjaju podatke aplikacije. Za odvojenu
test bazu postavi `TEST_DATABASE_URL`; u suprotnom se koristi lokalni
`DATABASE_URL` iz `.env` datoteke. Korisnik baze mora da ima dozvolu za kreiranje šema.

Iz direktorijuma `ednevnik-frontend` pokreni `npm.cmd run build` da proveriš
pripremu frontenda za objavljivanje.

## Planirani naredni koraci

- Pregled sopstvenih ocena za učenike, bez mogućnosti izmene.
- Školske godine, polugodišta i pristup arhivi pre korišćenja dnevnika tokom više godina.
- Promena i obnova lozinke, bezbedno kreiranje početnog administratorskog naloga i ograničavanje pokušaja prijave.
- Evidencija izmena i brisanja ocena, kao i pravila za zaključivanje ocena.
- Objavljivanje aplikacije, rezervne kopije i testiranje celih korisničkih tokova u pregledaču.

## Čuvanje i slanje izmena na GitHub

Prvo napravi commit i pošalji izmene iz direktorijuma `ednevnik-backend` na granu
`main`. Zatim u korenu projekta napravi commit koji sadrži ažuriranu referencu
podmodula i izmene frontenda, pa pošalji granu `master`. Obe grane su potrebne
za preuzimanje kompletnog projekta.
