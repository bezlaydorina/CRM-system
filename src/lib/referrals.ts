import { prisma } from "@/lib/prisma";

export function referralCodeForAccount(accountId: string) {
  return `THECODE-${accountId.slice(0, 6).toUpperCase()}`;
}

/**
 * Új ügyfél felvételekor hívjuk, ha staff megadott egy ajánlói kódot. A kódot
 * visszafejti az azt kibocsátó account-ra (a kód az accountId első 6
 * karakteréből képződik), és létrehozza a Referral kapcsolatot "függőben"
 * állapotban - a tényleges jóváírás a szerződés aláírásakor történik
 * (lásd rewardReferralIfSigned).
 */
export async function linkReferralIfValid(newAccountId: string, referralCodeInput: string | null | undefined) {
  const raw = (referralCodeInput ?? "").trim().toUpperCase();
  if (!raw) return;
  const prefix = raw.startsWith("THECODE-") ? raw.slice("THECODE-".length) : raw;
  if (prefix.length < 6) return;

  const referrer = await prisma.account.findFirst({
    where: { id: { startsWith: prefix.toLowerCase() }, isInternalSales: false },
  });
  if (!referrer || referrer.id === newAccountId) return;

  await prisma.referral
    .create({ data: { referrerAccountId: referrer.id, referredAccountId: newAccountId } })
    .catch(() => {}); // már van neki ajánlója (referredAccountId unique), vagy egyéb ütközés - nem kritikus
}

/**
 * Szerződés aláíráskor hívjuk (manuális gomb és Dropbox Sign webhook is) - ha
 * az adott account egy még nem jóváírt ajánlás nyertese, jóváírjuk.
 */
export async function rewardReferralIfSigned(referredAccountId: string) {
  const referral = await prisma.referral.findUnique({ where: { referredAccountId } });
  if (!referral || referral.status === "REWARDED") return;
  await prisma.referral.update({ where: { id: referral.id }, data: { status: "REWARDED", rewardedAt: new Date() } });
}
