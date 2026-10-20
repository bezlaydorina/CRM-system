# The Code CRM

Multi-tenant ügynökségi CRM + fehér-címkés ügyfélportál, a `The Code CRM – Rendszerspecifikáció Claude Code-hoz` dokumentum alapján felépítve.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (lásd lent az éles telepítést Supabase-szel)
- Saját JWT-cookie alapú session (`jose`), nincs külső auth szolgáltató
- `@dnd-kit` a Kanban drag&drop táblákhoz (ügyfél életciklus, CRM pipeline, feladatok)

## Indítás (helyi fejlesztés)

Kell egy helyi (vagy bármilyen elérhető) Postgres adatbázis. Ha nincs:

```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE DATABASE crm_dev;"
```

Majd `.env`-ben állítsd be (lásd `.env.example`):

```
DATABASE_URL="postgresql://postgres:<jelszó>@localhost:5432/crm_dev"
DIRECT_URL="postgresql://postgres:<jelszó>@localhost:5432/crm_dev"
SESSION_SECRET="<bármilyen hosszú random string>"

# Email küldéshez (meghívók, jelszó-beállító linkek, riport-email) - opcionális helyben:
# RESEND_API_KEY nélkül minden email csak a konzolra íródik ki, nem küld semmit.
RESEND_API_KEY=""
EMAIL_FROM="The Code <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

```bash
npm install
npx prisma migrate dev   # létrehozza a táblákat
npm run db:seed          # demó ügynökség, csapat, 13 ügyfél, leadek, feladatok, stb.
npm run dev
```

Nyisd meg: http://localhost:3000

### Bejelentkezés

| Felület | URL | Email | Jelszó |
|---|---|---|---|
| Belső (Service/Sales admin) | `/login` | `admin@thecode.hu` | `thecode123` |
| Belső (CSM) | `/login` | `csm@thecode.hu` | `thecode123` |
| Ügyfélportál | `/portal/login` | `kapcsolat@zoldkert.hu` | `ugyfel123` |

Minden csapattag jelszava `thecode123`, minden ügyfél elsődleges kontaktjáé `ugyfel123` (lásd `prisma/seed.ts`).

Admin nézetben a fejléc keresőjével bármelyik ügyfél portálját megnyithatod ("nézd, amit ő lát" impersonáció) – a sárga sáv "Vissza a saját főoldalra" gombjával lépsz ki belőle.

## Éles telepítés (Supabase + Vercel)

1. **Supabase projekt létrehozása** – [supabase.com](https://supabase.com), új projekt, jegyezd fel az adatbázis jelszavát.
2. **Connection stringek** – Project Settings → Database → Connection string:
   - *Transaction pooler* (port 6543) → ez lesz a Vercel `DATABASE_URL`-je (az app futásidejű lekérdezései ezen mennek, `?pgbouncer=true` paraméterrel).
   - *Direct connection* (port 5432) → ez lesz a Vercel `DIRECT_URL`-je (ezen fut a `prisma migrate deploy` build közben).
3. **Vercel projekt** – [vercel.com](https://vercel.com) → "Add New Project" → importáld a `bezlaydorina/CRM-system` GitHub repót, branch: `claude/crm-rendszer-tuu9xn` (vagy a végleges `main`, ha oda kerül).
4. **Környezeti változók** (Vercel → Settings → Environment Variables):
   - `DATABASE_URL` = a pooler connection string
   - `DIRECT_URL` = a direct connection string
   - `SESSION_SECRET` = egy hosszú random string (pl. `openssl rand -base64 32`)
   - `RESEND_API_KEY` = lásd az "Email küldés" szekciót lent – enélkül minden email (meghívók, jelszó-linkek, riport-email) kihagyásra kerül, a többi funkció változatlanul működik.
   - `EMAIL_FROM` = pl. `"The Code <onboarding@resend.dev>"` verifikált domain nélkül, vagy `"The Code <hello@thecode.hu>"` ha a domain már verifikálva van a Resende-ben.
   - `NEXT_PUBLIC_APP_URL` = az éles domain (pl. `https://crm.thecode.hu`) – ez kerül bele az emailekben küldött linkekbe.
5. **Deploy** – a build parancs (`prisma migrate deploy && prisma generate && next build`, lásd `package.json`) minden deploy-nál automatikusan lefuttatja a függő migrációkat az éles adatbázison.
6. **Seedelés (opcionális, csak első alkalommal)** – a demó adatok (`npm run db:seed`) kitalált ügyfeleket hoznak létre; éles induláshoz ezt át lehet hagyni, és az admin a "+ Új ügyfél" formmal viszi fel az első valós ügyfeleket. Ha mégis kellenek demó adatok a teszteléshez, a seedet a Supabase connection stringgel helyben kell futtatni (`DATABASE_URL=... DIRECT_URL=... npm run db:seed`), mert a Vercel build nem futtatja automatikusan.

## Email küldés (Resend)

Minden meghívó-email (ügyfélportál csapattag, belső csapattag), jelszó-beállító link és a riport "Email" gomb a [Resend](https://resend.com)-en keresztül megy:

1. Regisztrálj a [resend.com](https://resend.com)-on, hozz létre egy API kulcsot.
2. Domain verifikáció nélkül azonnal tudsz küldeni egy `onboarding@resend.dev` tesztcímről (max. a saját, Resende-hez regisztrált email címedre) – ez jó teszteléshez, de élesben a sajátdomaines feladó (pl. `hello@thecode.hu`) ajánlott, amihez pár DNS rekordot (SPF/DKIM) kell felvenni a Resend "Domains" fülén.
3. Állítsd be a `RESEND_API_KEY`-t (és opcionálisan `EMAIL_FROM`-ot) a Vercel környezeti változói közt.

`RESEND_API_KEY` nélkül (pl. helyi fejlesztésnél) minden email-küldés csendben kimarad – a konzolba kiírja, mit küldött volna el, de minden más funkció (fiók létrehozása, meghívás, stb.) ugyanúgy működik.

## Megvalósított modulok

- **Auth & multi-tenant izoláció** – staff/kliens session, admin impersonáció, `account_id` szintű szűrés minden lekérdezésen, token-alapú meghívó/jelszó-beállító linkek (`/jelszo-beallitas/:token`) valós email-küldéssel (Resend, lásd lent)
- **Ügyfelek** – Lista + 12 szakaszos életciklus Kanban (drag&drop), 5 fülös adatlap (Áttekintés / CRM és leadek / Adatok és űrlapok / Projektek és szolgáltatások / Pénzügy), CSV export, jelszó módosítás, archiválás, törlés
- **Mini-CRM** (ügyfelenként) – több pipeline, egyéni szakaszok, JSON-alapú egyéni mező builder, Kanban + Kapcsolatok táblázat nézet, 4 fülös opportunity szerkesztő (adatok / jegyzetek / tennivalók / aktivitás napló), webhook-alapú lead-befogadás (`/api/webhook/crm/:token`), globális "beérkező leadek" feed
- **Feladatkezelés** – csapattagonkénti Kanban tábla, kategória szűrők, automatikus feladat-generálás (új ügyfél, elakadt onboarding, sikertelen fizetés)
- **CSM Jóváhagyás** – `draft → pending_internal → pending_client → approved/rejected` állapotgép, ugyanaz a komponens az admin és a kliens oldalon
- **Csapat, Naptár, Fizetések (Payments + pénzügyi rekonstrukció), Szerződések** – lásd lent a leegyszerűsítéseket
- **Ügyfélportál** – Kezdőlap (metrikák, milestone-ünneplés), Riportok (automata + korlátozott manuális), Jóváhagyások, Üzenetek, Fájlfeltöltés (valós lokális tárolással), saját CRM, Affiliate, Beállítások
- **Sales tab** – az ügynökség saját belső sales pipeline-ja (ugyanaz a CRM UI, más account-kontextus)
- **Projektek** (Weboldalak / Webshopok / Applikációk / Automatizációk / Egyedi rendszerek) – kategóriánkénti Kanban tábla (`Igényfelmérés → Tervezés → Fejlesztés → Tesztelés → Ügyfél jóváhagyás → Élesítve → Karbantartás`), projekt létrehozása ügyfélhez kötve, felelős-hozzárendelés, büdzsé és határidő követéssel

## Tudatosan egyszerűsített / stub részek

Ezekhez valós, díjköteles 3rd-party API-kulcs kellene, amivel ez a session nem rendelkezik:

- **Google Calendar szinkron** – a naptár modul figyelmezet, ha egy csapattagnak nincs kötve Google-fiókja, de a valós OAuth + Meet-link generálás mock (`meet.google.com/thecode-xxxxxx`)
- **The Code asszisztens** – egyszerű, szabályalapú válaszadó a saját account adatain (nem hív külső LLM API-t)
- **Fizetési szolgáltató (Stripe/Barion/SimplePay)** – a `Payment` modell és a UI kész, de a "fizetési link" egy generált placeholder URL, nincs mögötte valós fizetési folyamat
- **PWA telepítés** – nincs `manifest.json` / service worker még

Minden más – account/kontakt/csapat CRUD, a teljes CRM pipeline motor, a jóváhagyási lánc, a webhook-alapú lead-befogadás, a fájlfeltöltés, a projekt-nyilvántartás – valóban működik, saját Postgres adatbázisra írva.

## Adatmodell

Lásd `prisma/schema.prisma` – az összes entitás (Organization, Account, Contact, TeamMember, TeamAssignment, Pipeline, Stage, Opportunity, CustomFieldDefinition, Webhook, Task, Project, ApprovalItem, Payment, Contract, Report, Conversation/Message, FileAsset, CalendarEvent, Credential, AuthToken) a specifikáció 3. fejezete alapján.
