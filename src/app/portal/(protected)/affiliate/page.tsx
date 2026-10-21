import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { referralCodeForAccount } from "@/lib/referrals";

export default async function AffiliatePage() {
  const accountId = (await getEffectiveAccountId())!;
  const [account, referrals] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.referral.findMany({ where: { referrerAccountId: accountId }, include: { referredAccount: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const referralCode = referralCodeForAccount(accountId);
  const rewardedCount = referrals.filter((r) => r.status === "REWARDED").length;

  return (
    <div>
      <PageHeader title="Affiliate program" subtitle="1 ajánlás = 1 ingyen csomag örökre – halmozható jutalommal" />

      <Card className="mb-6">
        <p className="text-sm text-zinc-600">Az egyedi ajánlói kódod:</p>
        <p className="mt-1 font-mono text-xl font-semibold text-brand-gold-dark">{referralCode}</p>
        <Badge color="green">{rewardedCount} sikeres ajánlás eddig</Badge>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Step n={1} title="Ajánld tovább" desc="Küldd el a kódod egy ismerős cégnek, akinek jól jönne a marketing." />
        <Step n={2} title="Ő szerződést köt" desc="Amint az ajánlott cég aláírja a szerződést, jóváírjuk az ajánlást." />
        <Step n={3} title="Válassz csomagot, örökre ingyen" desc="Minden sikeres ajánlás után 1 hónap ingyenes csomagot kapsz, halmozva." />
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Ajánlásaid</h2>
        {referrals.length === 0 ? (
          <EmptyState text="Még nincs rögzített ajánlásod – add ki a kódodat, és amikor egy új ügyfél ezzel regisztrál nálunk, itt megjelenik." />
        ) : (
          <div className="space-y-1.5">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-sm">
                <span>{r.referredAccount.name}</span>
                <Badge color={r.status === "REWARDED" ? "green" : "amber"}>{r.status === "REWARDED" ? "Jóváírva" : "Folyamatban"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="mt-6 text-xs text-zinc-400">
        Account: {account?.name} · Az ajánlás valóban rögzítésre kerül, és a szerződés aláírásakor automatikusan
        jóváírásra kerül; a jutalom tényleges kifizetése (pl. 1 hónap jóváírása a számlázásban) ebben az MVP-ben
        nem indít el valós pénzügyi motort, azt staff kézzel érvényesíti a Fizetések oldalon.
      </p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <Card>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/15 font-semibold text-brand-gold-dark">{n}</div>
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{desc}</p>
    </Card>
  );
}
