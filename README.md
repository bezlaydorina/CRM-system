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

# Bankkártyás fizetéshez (Barion) - opcionális helyben:
# BARION_POS_KEY nélkül a "Fizetés" gomb egy hibaüzenettel tér vissza, minden más működik.
BARION_POS_KEY=""
BARION_PAYEE_EMAIL=""
BARION_ENV="test"

# Google Calendar szinkronhoz (valódi Meet-link generálás) - opcionális helyben:
# GOOGLE_CLIENT_ID/SECRET nélkül a "Csatlakoztatás" gomb egy hibaüzenettel tér vissza, minden más működik.
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
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
   - `NEXT_PUBLIC_APP_URL` = az éles domain (pl. `https://crm.thecode.hu`) – ez kerül bele az emailekben küldött linkekbe és a Barion redirect/callback URL-jeibe.
   - `BARION_POS_KEY`, `BARION_PAYEE_EMAIL`, `BARION_ENV` = lásd a "Fizetés (Barion)" szekciót lent – enélkül a "Fizetés" gomb hibaüzenetet ad, a többi funkció változatlanul működik.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` = lásd a "Google Calendar szinkron" szekciót lent – enélkül a "Csatlakoztatás" gomb hibaüzenetet ad, a többi funkció változatlanul működik.
5. **Deploy** – a build parancs (`prisma migrate deploy && prisma generate && next build`, lásd `package.json`) minden deploy-nál automatikusan lefuttatja a függő migrációkat az éles adatbázison.
6. **Seedelés (opcionális, csak első alkalommal)** – a demó adatok (`npm run db:seed`) kitalált ügyfeleket hoznak létre; éles induláshoz ezt át lehet hagyni, és az admin a "+ Új ügyfél" formmal viszi fel az első valós ügyfeleket. Ha mégis kellenek demó adatok a teszteléshez, a seedet a Supabase connection stringgel helyben kell futtatni (`DATABASE_URL=... DIRECT_URL=... npm run db:seed`), mert a Vercel build nem futtatja automatikusan.

## Email küldés (Resend)

Minden meghívó-email (ügyfélportál csapattag, belső csapattag), jelszó-beállító link és a riport "Email" gomb a [Resend](https://resend.com)-en keresztül megy:

1. Regisztrálj a [resend.com](https://resend.com)-on, hozz létre egy API kulcsot.
2. Domain verifikáció nélkül azonnal tudsz küldeni egy `onboarding@resend.dev` tesztcímről (max. a saját, Resende-hez regisztrált email címedre) – ez jó teszteléshez, de élesben a sajátdomaines feladó (pl. `hello@thecode.hu`) ajánlott, amihez pár DNS rekordot (SPF/DKIM) kell felvenni a Resend "Domains" fülén.
3. Állítsd be a `RESEND_API_KEY`-t (és opcionálisan `EMAIL_FROM`-ot) a Vercel környezeti változói közt.

`RESEND_API_KEY` nélkül (pl. helyi fejlesztésnél) minden email-küldés csendben kimarad – a konzolba kiírja, mit küldött volna el, de minden más funkció (fiók létrehozása, meghívás, stb.) ugyanúgy működik.

## Fizetés (Barion)

Az ügyfélportál "Fizetések" oldalán és az admin "Fizetések" oldalán a "Fizetés" / "Fizetési link megnyitása" gomb a [Barion](https://www.barion.com) Smart Gateway-jén keresztül indít valódi bankkártyás fizetést:

1. Regisztrálj egy Barion fiókot (a sandbox teszteléshez a [test.barion.com](https://test.barion.com)-on, valódi cég nélkül is percek alatt), hozz létre egy "Webshop" (POS) kulcsot.
2. A `BARION_PAYEE_EMAIL` a Barion fiókod regisztrált email címe (ide érkezik a pénz).
3. Állítsd be a `BARION_POS_KEY`, `BARION_PAYEE_EMAIL` és `BARION_ENV` (`test` vagy `prod`) változókat a Vercel környezeti változói közt.
4. A Barion fiókodban add meg a callback végpontot is (bár ezt maga a Payment/Start hívás is elküldi minden egyes fizetésnél): `https://<a-domained>/api/barion/callback`.

A fizetés állapotát két helyről is ellenőrizzük (a Barion authoritative API-ján keresztül, sosem a nyers callback body-ból): a Barion callback webhookján (`/api/barion/callback`) és a fizetés utáni redirect-oldalon (`/fizetes/eredmeny`), amelyik előbb fut le.

`BARION_POS_KEY`/`BARION_PAYEE_EMAIL` nélkül a "Fizetés" gomb egy "nincs beállítva" hibaüzenettel tér vissza, minden más funkció (fizetés manuális rögzítése/kézi "Fizetve" jelölés banki átutalásnál, stb.) változatlanul működik.

## Google Calendar szinkron

A "Csapat" oldalon minden csapattag saját Google Calendar-ját csatlakoztathatja; ha csatlakoztatva van, az admin "Naptár" oldalán létrehozott foglalásai valódi Google Calendar eseményként jönnek létre, automatikusan generált Google Meet linkkel (nem egy kitalált URL).

1. Hozz létre egy projektet a [Google Cloud Console](https://console.cloud.google.com)-ban, engedélyezd a "Google Calendar API"-t.
2. "APIs & Services → OAuth consent screen": állítsd be "External" típusra (vagy "Internal", ha Google Workspace szervezeted van); amíg nincs Google-verifikáció, csak a "Test users" listára felvett Google-fiókok tudnak csatlakozni – vedd fel ide a csapattagok Gmail-címeit.
3. "APIs & Services → Credentials → Create Credentials → OAuth client ID", típus: "Web application". Az "Authorized redirect URIs" alá vedd fel pontosan: `https://<éles-domain>/api/google-calendar/callback` (helyi teszteléshez: `http://localhost:3000/api/google-calendar/callback`).
4. A létrejött Client ID/Secret kerül a `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env változókba.

A csatlakoztatás egy valódi Google OAuth consent-tel történik (a "Csatlakoztatás" gombra kattintva az adott csapattag a saját Google-fiókjával jelentkezik be és ad hozzáférést) – nem az admin "csatlakoztatja" más nevében. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` nélkül a "Csatlakoztatás" gomb egy hibaüzenettel tér vissza, a foglalások ettől még ugyanúgy létrehozhatók, csak Meet-link nélkül.

## PWA telepítés

Az ügyfélportál telepíthető alkalmazásként (PWA): van `manifest.webmanifest` (`src/app/manifest.ts`), app ikonok (`public/icons/`), és egy service worker (`public/sw.js`), amit a gyökér layout regisztrál.

- Chrome/Edge/Android-on a "Beállítások" oldal "Telepítsd appként" kártyája a böngésző natív telepítési promptját (`beforeinstallprompt`) ajánlja fel egy gombbal.
- iOS Safarin (ahol nincs programozott telepítési API) a kártya lépésenkénti instrukciót ad a "Kezdőképernyőhöz adás" funkcióhoz.
- Ha az app már telepítve van (`display-mode: standalone`), a kártya ezt jelzi.

A service worker szándékosan konzervatív: csak a statikus app-shell asseteket (ikonok, offline oldal) cache-eli, minden `/api/` kérést és minden navigálást hálózat-elsőként kezel (csak teljes offline esetén esik vissza a cache-elt `/offline.html`-re) – egy CRM-ben az elavult, cache-elt ügyfél-/fizetési adat félrevezető lenne, ezért API-választ sosem cache-elünk. Nincs hozzá szükséges külső API-kulcs vagy fiók.

## The Code asszisztens

Az ügyfélportál "The Code asszisztens" oldala valódi Claude (Anthropic) API-hívással válaszol az ügyfél saját, élő CRM-adatai alapján (RAG-szerűen: minden kérdés mellé odakerül kontextusként az adott account projektjeinek, leadjeinek, fizetéseinek és jóváhagyásainak aktuális állapota – más account adatát sosem látja a modell).

1. Hozz létre egy API-kulcsot a [console.anthropic.com](https://console.anthropic.com)-on.
2. Add meg az `ANTHROPIC_API_KEY` változót a Vercel környezeti változói közt.

`ANTHROPIC_API_KEY` nélkül (vagy ha a hívás bármilyen okból sikertelen) az asszisztens egy egyszerű, szabályalapú válaszadóra esik vissza, amely ugyanígy csak a saját account adatait ismeri – a funkció sosem áll le hibával.

## Megvalósított modulok

- **Auth & multi-tenant izoláció** – staff/kliens session, admin impersonáció, `account_id` szintű szűrés minden lekérdezésen, token-alapú meghívó/jelszó-beállító linkek (`/jelszo-beallitas/:token`) valós email-küldéssel (Resend, lásd lent)
- **Ügyfelek** – Lista + 12 szakaszos életciklus Kanban (drag&drop), 5 fülös adatlap (Áttekintés / CRM és leadek / Adatok és űrlapok / Projektek és szolgáltatások / Pénzügy), CSV export, jelszó módosítás, archiválás, törlés
- **Mini-CRM** (ügyfelenként) – több pipeline, egyéni szakaszok, JSON-alapú egyéni mező builder, Kanban + Kapcsolatok táblázat nézet, 4 fülös opportunity szerkesztő (adatok / jegyzetek / tennivalók / aktivitás napló), webhook-alapú lead-befogadás (`/api/webhook/crm/:token`), globális "beérkező leadek" feed
- **Feladatkezelés** – csapattagonkénti Kanban tábla, kategória szűrők, automatikus feladat-generálás (új ügyfél, elakadt onboarding, sikertelen fizetés)
- **CSM Jóváhagyás** – `draft → pending_internal → pending_client → approved/rejected` állapotgép, ugyanaz a komponens az admin és a kliens oldalon
- **Csapat, Szerződések** – csapattag-kezelés valós Google Calendar-csatlakoztatással (lásd fent); a szerződés-munkafolyamat (sablon → kiküldés → aláírás) kézi állapotváltással követett, nincs mögötte valós e-aláírás API (DocuSign-szerű)
- **The Code asszisztens** – valódi Claude API-hívás az ügyfél saját CRM-adatain, szabályalapú fallback-kel (lásd lent)
- **Naptár** – közös csapat-naptár, csapattagonkénti Google Calendar OAuth-csatlakoztatás, valódi Meet-link generálás csatlakoztatott csapattagoknál (lásd lent)
- **Fizetések** – egyszeri/havi díjak nyilvántartása, valódi bankkártyás fizetés Barion Smart Gateway-en keresztül (admin + ügyfélportál "Fizetések" oldal), webhook + redirect alapú állapot-szinkron, kézi "Fizetve" jelölés banki átutaláshoz, pénzügyi rekonstrukció
- **Ügyfélportál** – Kezdőlap (metrikák, milestone-ünneplés), Riportok (automata + korlátozott manuális), Jóváhagyások, Üzenetek, Fájlfeltöltés (valós lokális tárolással), saját CRM, Affiliate, Beállítások
- **PWA telepítés** – manifest, service worker, app ikonok, valódi "Telepítsd appként" gomb (lásd lent)
- **Sales tab** – az ügynökség saját belső sales pipeline-ja (ugyanaz a CRM UI, más account-kontextus)
- **Projektek** (Weboldalak / Webshopok / Applikációk / Automatizációk / Egyedi rendszerek) – kategóriánkénti Kanban tábla (`Igényfelmérés → Tervezés → Fejlesztés → Tesztelés → Ügyfél jóváhagyás → Élesítve → Karbantartás`), projekt létrehozása ügyfélhez kötve, felelős-hozzárendelés, büdzsé és határidő követéssel

## Tudatosan egyszerűsített rész

Ehhez valós, díjköteles 3rd-party API kellene, amivel ez a session nem rendelkezik:

- **Szerződések e-aláírása** – a `Contract` modell és a UI (sablon → kiküldés → aláírás) kész, de az állapotváltás kézi, nincs mögötte valós e-aláírás szolgáltató (pl. DocuSign) integráció

Minden más – account/kontakt/csapat CRUD, a teljes CRM pipeline motor, a jóváhagyási lánc, a webhook-alapú lead-befogadás, a fájlfeltöltés, a projekt-nyilvántartás, az email küldés, a fizetés, a Google Calendar szinkron, a PWA telepítés és a The Code asszisztens – valóban működik, saját Postgres adatbázisra írva.

## Adatmodell

Lásd `prisma/schema.prisma` – az összes entitás (Organization, Account, Contact, TeamMember, TeamAssignment, Pipeline, Stage, Opportunity, CustomFieldDefinition, Webhook, Task, Project, ApprovalItem, Payment, Contract, Report, Conversation/Message, FileAsset, CalendarEvent, Credential, AuthToken) a specifikáció 3. fejezete alapján.
