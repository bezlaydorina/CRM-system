// Central definitions for the string-based "enum" fields used across the
// schema (SQLite has no native enum support in Prisma).

export const ACCOUNT_LIFECYCLE_STAGES = [
  { key: "CSM_CONTACT", label: "CSM felveszi a kapcsolatot" },
  { key: "MEETING", label: "Belépett · egyeztetés" },
  { key: "ONBOARDING_FORM", label: "Onboarding kitöltése" },
  { key: "WAITING_IMAGES", label: "Képek feltöltésére vár" },
  { key: "LANDING_IN_PROGRESS", label: "Landing készül" },
  { key: "LANDING_REVIEW", label: "Landing visszaküldés" },
  { key: "IN_REVISION", label: "Javításon" },
  { key: "ADMIN_APPROVAL", label: "Admin jóváhagyásra vár" },
  { key: "READY_TO_LAUNCH", label: "Indítható" },
  { key: "LIVE", label: "Aktív együttműködés" },
  { key: "RETAINED", label: "1. hónap → 1. év" },
  { key: "LOST", label: "LOST" },
] as const;

export type AccountLifecycleStage = (typeof ACCOUNT_LIFECYCLE_STAGES)[number]["key"];

export function lifecycleLabel(key: string) {
  return ACCOUNT_LIFECYCLE_STAGES.find((s) => s.key === key)?.label ?? key;
}

/** Whether an account is in an actively-running engagement stage. */
export function isAccountLive(lifecycleStage: string) {
  return lifecycleStage === "LIVE" || lifecycleStage === "RETAINED";
}

export const TEAM_ROLES = ["Admin", "CSM", "Closer", "Setter", "Fejlesztő", "Értékesítő"] as const;

export const CUSTOM_FIELD_TYPES = [
  { key: "TEXT", label: "Szöveg" },
  { key: "LONG_TEXT", label: "Hosszú szöveg" },
  { key: "NUMBER", label: "Szám" },
  { key: "DATE", label: "Dátum" },
  { key: "SELECT", label: "Választható lista" },
  { key: "MULTISELECT", label: "Többválasztós lista" },
  { key: "EMAIL", label: "Email" },
  { key: "PHONE", label: "Telefon" },
  { key: "URL", label: "URL" },
  { key: "CHECKBOX", label: "Jelölőnégyzet" },
] as const;

export const TASK_CATEGORIES = [
  "Sikertelen fizetés",
  "Felhívni",
  "Kreatív",
  "Szövegírás",
  "Landing",
  "Összeállítás",
  "Egyéb",
] as const;

export const TASK_PRIORITIES = [
  { key: "LOW", label: "Alacsony" },
  { key: "MEDIUM", label: "Közepes" },
  { key: "HIGH", label: "Magas" },
  { key: "URGENT", label: "Sürgős" },
] as const;

export const TASK_STATUS_COLUMNS = [
  { key: "ASSIGNED", label: "Neked osztották" },
  { key: "WAITING", label: "Várakozik" },
  { key: "DAY_ONE", label: "Day One" },
  { key: "DAY_TWO", label: "Day Two" },
  { key: "DAY_THREE", label: "Day Three" },
  { key: "BLOCKED", label: "Blokkolt" },
] as const;

export const APPROVAL_TYPES = [
  { key: "CREATIVE", label: "Kreatívok" },
  { key: "LANDING", label: "Landing oldalak" },
  { key: "COPY", label: "Szövegek" },
  { key: "IMAGE", label: "Elutasított képek" },
] as const;

export const APPROVAL_STATUSES = [
  { key: "DRAFT", label: "Piszkozat" },
  { key: "PENDING_INTERNAL", label: "Nálam áll" },
  { key: "PENDING_CLIENT", label: "Ügyfélnél áll" },
  { key: "APPROVED", label: "Jóváhagyva" },
  { key: "REJECTED", label: "Elutasítva" },
] as const;

export const PAYMENT_STATUSES = [
  { key: "CREATED", label: "Létrehozva" },
  { key: "SENT", label: "Elküldve" },
  { key: "PAID", label: "Fizetve" },
  { key: "EXPIRED", label: "Lejárt" },
  { key: "PENDING", label: "Várakozik" },
] as const;

export const PROJECT_CATEGORIES = [
  { key: "WEBOLDAL", label: "Weboldalak", slug: "weboldalak" },
  { key: "WEBSHOP", label: "Webshopok", slug: "webshopok" },
  { key: "APPLIKACIO", label: "Applikációk", slug: "applikaciok" },
  { key: "AUTOMATIZACIO", label: "Automatizációk", slug: "automatizaciok" },
  { key: "EGYEDI_RENDSZER", label: "Egyedi rendszerek", slug: "egyedi-rendszerek" },
] as const;

export function projectCategoryBySlug(slug: string) {
  return PROJECT_CATEGORIES.find((c) => c.slug === slug);
}

export const PROJECT_STATUSES = [
  { key: "IGENYFELMERES", label: "Igényfelmérés", color: "#6366f1" },
  { key: "TERVEZES", label: "Tervezés", color: "#3b82f6" },
  { key: "FEJLESZTES", label: "Fejlesztés", color: "#0ea5e9" },
  { key: "TESZTELES", label: "Tesztelés", color: "#f59e0b" },
  { key: "UGYFEL_JOVAHAGYAS", label: "Ügyfél jóváhagyás", color: "#a855f7" },
  { key: "ELESITVE", label: "Élesítve", color: "#22c55e" },
  { key: "KARBANTARTAS", label: "Karbantartás", color: "#64748b" },
] as const;

export const INDUSTRIES = [
  "Kertészet",
  "Lakberendezés",
  "Egészségügy",
  "Kereskedelem",
  "Autókölcsönzés",
  "Turizmus",
  "Sport & fitnesz",
  "Szépségipar",
  "Szolgáltatóipar",
  "Építőipar",
  "HoReCa",
  "Egyéb",
] as const;

export const ACCOUNT_PACKAGES = [
  {
    key: "BASIC",
    label: "Basic",
    monthlyFee: 97000,
    setupFee: 179000,
    description: "Weboldal/webshop + alap CRM + Ügyfélportál. Az induláshoz minden szükséges a helyén.",
  },
  {
    key: "AGENCY",
    label: "The Code",
    monthlyFee: 97000,
    setupFee: 450000,
    description: "Teljes fejlesztés + CRM automatizáció + AI modul. Hardver opcionálisan +350 000 Ft setup-pal.",
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    monthlyFee: 247000,
    setupFee: 3450000,
    description: "A teljes The Code rendszer ajándék hardverrel, prémium AI-val és Egyedi rendszerrel, 20+ modullal.",
  },
] as const;

export const AI_MODULES = [
  { key: "CLAUDE", label: "Claude", vendor: "Anthropic" },
  { key: "CHATGPT", label: "ChatGPT", vendor: "OpenAI" },
  { key: "GEMINI", label: "Gemini", vendor: "Google" },
  { key: "GROK", label: "Grok", vendor: "xAI" },
] as const;

export const HARDWARE_COMPUTERS = [
  { key: "CUSTOM_PC", label: "Custom PC (AEROCOOL fehér)" },
  { key: "MAC_MINI", label: "Apple Mac mini M4" },
  { key: "MACBOOK_AIR", label: "Apple MacBook Air M4" },
] as const;

export const HARDWARE_MONITORS = [
  { key: "MSI_34", label: 'MSI MD342CQPW (34" Ultrawide)' },
  { key: "SAMSUNG_32", label: 'Samsung ViewFinity S7 (32" 4K)' },
] as const;

export const HARDWARE_SETUP_FEE = 350000;

export const ONBOARDING_ADDONS = [
  { key: "VIDEO_EDITING", label: "Videó editing csomag", description: "3 db profi vágott videó havonta, social media formátumokra optimalizálva", price: 49000, billing: "MONTHLY" as const },
  { key: "EXTRA_DESIGN", label: "Extra design csomag", description: "+5 db egyedi grafikai anyag havonta a weboldalhoz/apphoz", price: 59000, billing: "MONTHLY" as const },
  { key: "AB_TESTING", label: "A/B tesztelés modul", description: "Landing oldal A/B tesztek, riportokkal", price: 49000, billing: "MONTHLY" as const },
  { key: "LANDING_3D", label: "3D videós landing oldal", description: "Mozgó, 3D-s videóval hajtott landing oldal – a görgetés vezérli a videót. Nem része egyetlen csomagnak sem.", price: 350000, billing: "ONE_TIME" as const },
  { key: "EMAIL_AUTOMATION", label: "Email kampány automatizáció", description: "Behavioral triggerek, lifecycle és broadcast kampányok", price: 500000, billing: "MONTHLY" as const },
  { key: "SMS_AUTOMATION", label: "SMS automatizáció", description: "Automata SMS sequence-ek a CRM-ben", price: 79000, billing: "MONTHLY" as const },
  { key: "MAINTENANCE", label: "Weboldal frissítés és karbantartás", description: "Rendszeres tartalmi frissítés, biztonsági frissítések és technikai karbantartás", price: 25000, billing: "MONTHLY" as const },
  { key: "PRIORITY_SUPPORT", label: "Priority support", description: "Több havi meeting és rendszeres személyre szabott kommunikáció a csapattal", price: 79000, billing: "MONTHLY" as const },
  { key: "EXTRA_LANDING", label: "Extra landing oldal", description: "További landing oldal építés, projekthez, termékhez vagy promócióhoz", price: 250000, billing: "ONE_TIME" as const },
] as const;

export const CONTRACT_STATUSES = [
  { key: "DRAFT", label: "Tervezet" },
  { key: "SENT", label: "Elküldve" },
  { key: "VIEWED", label: "Megtekintve" },
  { key: "SIGNED", label: "Aláírva" },
] as const;

export function formatHUF(amount: number) {
  return new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(amount) + " Ft";
}

export function labelFor<T extends { key: string; label: string }>(list: readonly T[], key: string) {
  return list.find((x) => x.key === key)?.label ?? key;
}
