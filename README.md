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

## Szerződések e-aláírása (Dropbox Sign)

Az admin "Szerződések" oldalon a "Küldés e-aláírásra" gomb a szerződés adataiból (ügyfél neve, sablon, összeg) valódi, Magyar nyelvű PDF-et generál (PDF-lib + beágyazott DejaVu Sans font – a magyar ő/ű karakterek miatt a beépített PDF-alapfontok nem jók), majd elküldi az ügyfél elsődleges kapcsolattartójának aláírásra a [Dropbox Sign](https://sign.dropbox.com) API-n keresztül.

1. Regisztrálj egy Dropbox Sign fiókot, és az API beállításoknál hozz létre egy API-kulcsot.
2. Add meg a `DROPBOX_SIGN_API_KEY` változót a Vercel környezeti változói közt. Alapértelmezetten teszt-módban megy minden kérés (`DROPBOX_SIGN_TEST_MODE="true"`), ami nem jogilag kötelező érvényű – élesben állítsd `"false"`-ra.
3. A Dropbox Sign API App beállításainál állítsd be a callback (webhook) URL-t: `https://<a-domained>/api/dropbox-sign/callback`.

Innentől az állapotot (Elküldve → Megtekintve → Aláírva/Elutasítva) a Dropbox Sign webhookja automatikusan frissíti – sosem a nyers webhook body-ból, hanem mindig a Dropbox Sign API-tól a saját API-kulcsunkkal frissen visszakérdezve (ugyanaz az elv, mint a Barion fizetési callback-nél), és a webhook hitelességét HMAC-SHA256 event-hash ellenőrzéssel validáljuk. Aláírás után az aláírt végleges PDF-et is letöltjük és eltároljuk.

`DROPBOX_SIGN_API_KEY` nélkül a "Küldés e-aláírásra" gomb egy hibaüzenettel tér vissza; a korábbi kézi állapotkövetés (Elküldés/Megtekintve/Aláírva gombok) a még nem e-aláírásra küldött szerződéseknél (pl. papíron aláírt szerződéseknél) változatlanul elérhető marad.

## Jóváhagyások

A "CSM Jóváhagyás" oldalon a "+ Új jóváhagyásra váró tétel" formmal staff valódi fájlt (kép/videó) tölthet fel, ami a meglévő helyi fájltárolási mintát követi (`public/uploads/<accountId>/approvals/`). Nincs hozzá szükséges külső API-kulcs vagy fiók.

## Automatikus riportok (Vercel Cron)

Minden aktív, élő (nem teszt, nem belső sales) ügyfélnek hetente/havonta automatikusan legenerálódik és ki is küldésre kerül a riport a `vercel.json`-ban definiált Vercel Cron job-okon keresztül (`/api/cron/reports?period=WEEK|MONTH`).

1. Add meg a `CRON_SECRET` változót a Vercel környezeti változói közt (bármilyen hosszú, random string - pl. `openssl rand -base64 32`).
2. A Vercel automatikusan beállítja a `vercel.json`-ban megadott cron ütemezést a deploy után - nincs külön teendő.

`CRON_SECRET` nélkül a `/api/cron/reports` végpont 503-at ad és nem fut le (nincs publikusan hívható riport-spam vektor); hibás `Authorization` headerrel 401-et. A manuális riport-készítés (ügyfélportál "Riportok" oldal) ettől függetlenül mindig működik.

## Affiliate program

Az ügyfélportál "Affiliate" oldalán minden ügyfélnek van egy valódi ajánlói kódja. Új ügyfél felvételekor (admin "+ Új ügyfél" form) staff megadhatja a kapott ajánlói kódot - ez összeköti az ajánló és az ajánlott account-ot "függőben" állapotban, majd a szerződés aláírásakor (kézi állapotváltás vagy Dropbox Sign webhook egyaránt) automatikusan jóváírásra kerül. Nincs hozzá szükséges külső API-kulcs; a jutalom tényleges pénzügyi érvényesítése (pl. 1 hónap jóváírása a számlázásban) staff feladata a Fizetések oldalon.

## Értékesítési felvétel / Onboarding kérdőív

Az admin Beállítások oldalon staff szabadon összeállíthatja a két kérdőív (Értékesítési felvétel, Onboarding kérdőív) mezőit - ugyanazzal a JSON-alapú dinamikus mező-motorral, mint a mini-CRM Opportunity egyéni mezői. A kérdések szervezet-szintűek (minden ügyfélnél ugyanazok), a válaszok account-szintűek, és az ügyfél Adatok fülén tölthetők ki.

## Ügynökség-szintű branding

Az admin Beállítások oldalon valódi logót lehet feltölteni és márkaszínt beállítani, ami azonnal (build nélkül) megjelenik mind az admin felületen, mind az összes ügyfél portálján. Az egyedi domain mező csak rögzítésre kerül - a tényleges DNS-kötéshez add hozzá ugyanezt a domaint a Vercel projekt "Domains" beállításainál, és állítsd be a kért DNS rekordot a domain-szolgáltatódnál.

## Sötét téma

Az admin és a portál Beállítások oldalán is valódi, nézőnkénti (localStorage-ban perzisztált) Világos/Sötét/Rendszer kapcsoló van, FOUC-mentes betöltéssel. A megosztott UI-elemek (kártyák, badge-ek, az admin fejléc) és a teljes alap háttér/szöveg réteg helyesen vált sötét módba; egyedi, oldal-specifikus elemek (pl. egyes táblázatok, nyers input mezők) stílusa ebben a körben nem lett egyenként átnézve.

## Hitelesítő adatok titkosítása

Az ügyfél Adatok fülén rögzített belépési adatok (pl. weboldal admin jelszavak) `CREDENTIALS_ENCRYPTION_KEY` esetén AES-256-GCM-mel titkosítva kerülnek tárolásra az adatbázisban.

1. Generálj egy kulcsot: `openssl rand -base64 32`.
2. Add meg a `CREDENTIALS_ENCRYPTION_KEY` változót a Vercel környezeti változói közt.

`CREDENTIALS_ENCRYPTION_KEY` nélkül a belépési adatok síkszövegként kerülnek tárolásra (mint korábban) - a funkció enélkül is változatlanul működik, csak titkosítás nélkül.

## Megvalósított modulok

- **Auth & multi-tenant izoláció** – staff/kliens session, admin impersonáció, `account_id` szintű szűrés minden lekérdezésen, token-alapú meghívó/jelszó-beállító linkek (`/jelszo-beallitas/:token`) valós email-küldéssel (Resend, lásd lent)
- **Ügyfelek** – Lista + 12 szakaszos életciklus Kanban (drag&drop), 5 fülös adatlap (Áttekintés / CRM és leadek / Adatok és űrlapok / Projektek és szolgáltatások / Pénzügy), CSV export, jelszó módosítás, archiválás, törlés
- **Mini-CRM** (ügyfelenként) – több pipeline, egyéni szakaszok, JSON-alapú egyéni mező builder, Kanban + Kapcsolatok táblázat nézet, 4 fülös opportunity szerkesztő (adatok / jegyzetek / tennivalók / aktivitás napló), webhook-alapú lead-befogadás (`/api/webhook/crm/:token`), globális "beérkező leadek" feed
- **Feladatkezelés** – csapattagonkénti Kanban tábla, kategória szűrők, automatikus feladat-generálás (új ügyfél, elakadt onboarding, sikertelen fizetés)
- **CSM Jóváhagyás** – `draft → pending_internal → pending_client → approved/rejected` állapotgép, ugyanaz a komponens az admin és a kliens oldalon, valódi fájlfeltöltéssel új tételekhez (lásd lent)
- **Csapat** – csapattag-kezelés valós Google Calendar-csatlakoztatással (lásd fent)
- **Szerződések** – valódi PDF-generálás + e-aláírás Dropbox Sign-on keresztül, automatikus állapotkövetéssel (lásd lent)
- **The Code asszisztens** – valódi Claude API-hívás az ügyfél saját CRM-adatain, szabályalapú fallback-kel (lásd lent)
- **Naptár** – közös csapat-naptár, csapattagonkénti Google Calendar OAuth-csatlakoztatás, valódi Meet-link generálás csatlakoztatott csapattagoknál (lásd lent)
- **Fizetések** – egyszeri/havi díjak nyilvántartása, valódi bankkártyás fizetés Barion Smart Gateway-en keresztül (admin + ügyfélportál "Fizetések" oldal), webhook + redirect alapú állapot-szinkron, kézi "Fizetve" jelölés banki átutaláshoz, pénzügyi rekonstrukció
- **Ügyfélportál** – Kezdőlap (metrikák, milestone-ünneplés), Riportok (valódi automata heti/havi generálás Vercel Cronnal + manuális), Jóváhagyások, Üzenetek, Fájlfeltöltés (valós lokális tárolással), saját CRM, Affiliate (valós ajánlás-követés), Beállítások (sötét téma)
- **PWA telepítés** – manifest, service worker, app ikonok, valódi "Telepítsd appként" gomb (lásd lent)
- **Sales tab** – az ügynökség saját belső sales pipeline-ja (ugyanaz a CRM UI, más account-kontextus)
- **Projektek** (Weboldalak / Webshopok / Applikációk / Automatizációk / Egyedi rendszerek) – kategóriánkénti Kanban tábla (`Igényfelmérés → Tervezés → Fejlesztés → Tesztelés → Ügyfél jóváhagyás → Élesítve → Karbantartás`), projekt létrehozása ügyfélhez kötve, felelős-hozzárendelés, büdzsé és határidő követéssel
- **Értékesítési felvétel / Onboarding kérdőív** – szervezet-szintű, szerkeszthető kérdés-séma, account-szintű válaszokkal (lásd lent)
- **Ügynökség branding** – valódi logó + márkaszín testreszabás, azonnal érvényesül admin + portál felületen (lásd lent)
- **Biztonság** – ügyfél-hitelesítő adatok titkosítva (AES-256-GCM) tárolva (lásd lent)

## Nincs már stub rész

Minden funkció valódi, külső szolgáltatásra épülő integrációval működik (saját API-kulcs nélkül mindegyik graceful fallback-kel, sosem hibával leáll): account/kontakt/csapat CRUD, a teljes CRM pipeline motor, a jóváhagyási lánc (valós fájlfeltöltéssel), a webhook-alapú lead-befogadás, a fájlfeltöltés, a projekt-nyilvántartás, az email küldés (Resend), a fizetés (Barion), a Google Calendar szinkron, a PWA telepítés, a The Code asszisztens (Claude API), a szerződések e-aláírása (Dropbox Sign), az automatikus riport-generálás (Vercel Cron), az affiliate ajánlás-követés, az értékesítési felvétel/onboarding kérdőív, az ügynökség branding és a hitelesítő adatok titkosítása – mind saját Postgres adatbázisra írva.

**Tudatos, dokumentált korlátok** (nem hiányzó funkciók, hanem ismert, ésszerű scope-határok):

- **Sötét téma** – a megosztott UI-elemek és az alap háttér/szöveg réteg helyesen vált, de néhány oldal-specifikus, literál színt használó elem (pl. egyes táblázatok) stílusa nincs egyenként átnézve.
- **Egyedi domain** (ügynökség branding) – csak rögzítésre kerül, a tényleges DNS-kötés a Vercel projekt Domains beállításainál történik.
- **Credential titkosítás kulcsrotáció** – ha a `CREDENTIALS_ENCRYPTION_KEY` megváltozik/törlődik, a korábban azzal titkosított adatok nem fejthetők vissza (ez minden szimmetrikus titkosításos megoldás velejárója, nem erre a projektre jellemző hiányosság).

## Adatmodell

Lásd `prisma/schema.prisma` – az összes entitás (Organization, Account, Contact, TeamMember, TeamAssignment, Pipeline, Stage, Opportunity, CustomFieldDefinition, Webhook, Task, Project, ApprovalItem, Payment, Contract, Report, Conversation/Message, FileAsset, CalendarEvent, Credential, AuthToken, Referral, IntakeFormFieldDefinition, IntakeFormResponse) a specifikáció 3. fejezete alapján.
