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
  { key: "ADS_LIVE", label: "Hirdetések futnak" },
  { key: "RETAINED", label: "1. hónap → 1. év" },
  { key: "LOST", label: "LOST" },
] as const;

export type AccountLifecycleStage = (typeof ACCOUNT_LIFECYCLE_STAGES)[number]["key"];

export function lifecycleLabel(key: string) {
  return ACCOUNT_LIFECYCLE_STAGES.find((s) => s.key === key)?.label ?? key;
}

export const TEAM_ROLES = [
  "Admin",
  "CSM",
  "Closer",
  "Setter",
  "Szövegíró",
  "Grafikus",
  "LP Építő",
  "PPC Specialista",
  "Értékesítő",
] as const;

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
  "Hirdetésszöveg",
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
  { key: "AD_COPY", label: "Hirdetés szövegek" },
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
