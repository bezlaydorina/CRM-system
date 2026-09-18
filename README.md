# Synk AI CRM

Multi-tenant ügynökségi CRM + fehér-címkés ügyfélportál, a `Synk AI CRM – Rendszerspecifikáció Claude Code-hoz` dokumentum alapján felépítve.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (dev adatbázis, `prisma/dev.db`) — `DATABASE_URL`-lel könnyen Postgres-re állítható
- Saját JWT-cookie alapú session (`jose`), nincs külső auth szolgáltató
- `@dnd-kit` a Kanban drag&drop táblákhoz (ügyfél életciklus, CRM pipeline, feladatok)

## Indítás

```bash
npm install
npx prisma migrate dev   # létrehozza a dev.db-t és a táblákat
npm run db:seed          # demó ügynökség, csapat, 13 ügyfél, leadek, feladatok, stb.
npm run dev
```

Nyisd meg: http://localhost:3000

### Bejelentkezés

| Felület | URL | Email | Jelszó |
|---|---|---|---|
| Belső (Service/Sales admin) | `/login` | `admin@synkai.hu` | `synkai123` |
| Belső (CSM) | `/login` | `csm@synkai.hu` | `synkai123` |
| Ügyfélportál | `/portal/login` | `kapcsolat@zoldkert.hu` | `ugyfel123` |

Minden csapattag jelszava `synkai123`, minden ügyfél elsődleges kontaktjáé `ugyfel123` (lásd `prisma/seed.ts`).

Admin nézetben a fejléc keresőjével bármelyik ügyfél portálját megnyithatod ("nézd, amit ő lát" impersonáció) – a sárga sáv "Vissza a saját főoldalra" gombjával lépsz ki belőle.

## Megvalósított modulok

- **Auth & multi-tenant izoláció** – staff/kliens session, admin impersonáció, `account_id` szintű szűrés minden lekérdezésen
- **Ügyfelek** – Lista + 12 szakaszos életciklus Kanban (drag&drop), 5 fülös adatlap (Áttekintés / CRM és leadek / Adatok és űrlapok / Meta és szolgáltatások / Pénzügy), CSV export, jelszó módosítás, archiválás, törlés
- **Mini-CRM** (ügyfelenként) – több pipeline, egyéni szakaszok, JSON-alapú egyéni mező builder, Kanban + Kapcsolatok táblázat nézet, 4 fülös opportunity szerkesztő (adatok / jegyzetek / tennivalók / aktivitás napló), webhook-alapú lead-befogadás (`/api/webhook/crm/:token`), globális "beérkező leadek" feed
- **Feladatkezelés** – csapattagonkénti Kanban tábla, kategória szűrők, automatikus feladat-generálás (új ügyfél, elakadt onboarding, sikertelen fizetés)
- **CSM Jóváhagyás** – `draft → pending_internal → pending_client → approved/rejected` állapotgép, ugyanaz a komponens az admin és a kliens oldalon
- **Csapat, Naptár, Fizetések (Payments + pénzügyi rekonstrukció), Szerződések** – lásd lent a leegyszerűsítéseket
- **Ügyfélportál** – Kezdőlap (metrikák, milestone-ünneplés), Riportok (automata + korlátozott manuális), Jóváhagyások, Üzenetek, Fájlfeltöltés (valós lokális tárolással), saját CRM, Affiliate, Beállítások
- **Sales tab** – az ügynökség saját belső sales pipeline-ja (ugyanaz a CRM UI, más account-kontextus)

## Tudatosan egyszerűsített / stub részek

Ezekhez valós, díjköteles 3rd-party API-kulcs kellene, amivel ez a session nem rendelkezik:

- **Meta Ads / Conversion API** – az adatmodell és a UI megvan (`AdMetricSnapshot`, feature flagek), de a tényleges Meta OAuth és a live metrika-húzás helyén egy jól látható "fejlesztés alatt" panel van
- **Google Calendar szinkron** – a naptár modul figyelmezet, ha egy csapattagnak nincs kötve Google-fiókja, de a valós OAuth + Meet-link generálás mock (`meet.google.com/synk-xxxxxx`)
- **AI Creative / Winner Ads / Kreatív sablonok** – csak stub oldal, mert valós kép/szöveg-generáló LLM-hívást igényelnének
- **Synk AI asszisztens** – egyszerű, szabályalapú válaszadó a saját account adatain (nem hív külső LLM API-t)
- **Fizetési szolgáltató (Stripe/Barion/SimplePay)** – a `Payment` modell és a UI kész, de a "fizetési link" egy generált placeholder URL, nincs mögötte valós fizetési folyamat
- **PWA telepítés** – nincs `manifest.json` / service worker még

Minden más – account/kontakt/csapat CRUD, a teljes CRM pipeline motor, a jóváhagyási lánc, a webhook-alapú lead-befogadás, a fájlfeltöltés – valóban működik, saját SQLite adatbázisra írva.

## Adatmodell

Lásd `prisma/schema.prisma` – az összes entitás (Organization, Account, Contact, TeamMember, TeamAssignment, Pipeline, Stage, Opportunity, CustomFieldDefinition, Webhook, Task, ApprovalItem, Payment, Contract, Report, Conversation/Message, FileAsset, CalendarEvent, AdMetricSnapshot, Credential) a specifikáció 3. fejezete alapján.
