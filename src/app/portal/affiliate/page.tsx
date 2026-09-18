import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader, Card, Badge } from "@/components/ui";

export default async function AffiliatePage() {
  const accountId = (await getEffectiveAccountId())!;
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  const referralCode = `SYNK-${accountId.slice(0, 6).toUpperCase()}`;

  return (
    <div>
      <PageHeader title="Affiliate program" subtitle="1 ajánlás = 1 ingyen csomag örökre – halmozható jutalommal" />

      <Card className="mb-6">
        <p className="text-sm text-zinc-600">Az egyedi ajánlói kódod:</p>
        <p className="mt-1 font-mono text-xl font-semibold text-emerald-700">{referralCode}</p>
        <Badge color="green">0 sikeres ajánlás eddig</Badge>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Step n={1} title="Ajánld tovább" desc="Küldd el a kódod egy ismerős cégnek, akinek jól jönne a marketing." />
        <Step n={2} title="Ő szerződést köt" desc="Amint az ajánlott cég aláírja a szerződést, jóváírjuk az ajánlást." />
        <Step n={3} title="Válassz csomagot, örökre ingyen" desc="Minden sikeres ajánlás után 1 hónap ingyenes csomagot kapsz, halmozva." />
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Account: {account?.name} · Az affiliate kifizetés-követés és az automatikus jóváírás ebben az MVP-ben statikus
        demó, valós pénzügyi motort nem indít el.
      </p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <Card>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">{n}</div>
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{desc}</p>
    </Card>
  );
}
