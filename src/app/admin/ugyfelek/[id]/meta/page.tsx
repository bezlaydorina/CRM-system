import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, StubNotice } from "@/components/ui";
import { updateFeatureFlagsAction } from "@/lib/actions/account-actions";

export default async function AccountMetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) notFound();

  const flags = JSON.parse(account.featureFlags) as { crm: boolean; calendar: boolean; chatGptAdsTab: boolean };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Modul-kapcsolók</h2>
        <form action={updateFeatureFlagsAction.bind(null, id)} className="space-y-3">
          <Toggle name="crm" label="CRM modul aktív" defaultChecked={flags.crm} />
          <Toggle name="calendar" label="Naptár modul aktív" defaultChecked={flags.calendar} />
          <Toggle name="chatGptAdsTab" label="ChatGPT hirdetés fül" defaultChecked={flags.chatGptAdsTab} />
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Meta hirdetési fiók</h2>
          {account.adsLive ? <Badge color="green">Csatlakoztatva (demó)</Badge> : <Badge color="gray">Nincs csatlakoztatva</Badge>}
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          Fiók, oldal, Instagram, Pixel és fizetési mód kiválasztása – valós OAuth varázsló Meta App-hoz kötött API
          kulcsot igényel.
        </p>
        <StubNotice feature="Meta OAuth összekapcsolás" />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Conversion API</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Pixel ID" value="—" />
          <Info label="Test Events Code" value="—" />
          <Info label="Sikeres események (24ó)" value="0" />
          <Info label="Hibás események (24ó)" value="0" />
        </div>
        <StubNotice feature="Meta Conversion API server-side tracking" />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Meta Lead Ads → CRM</h2>
        <p className="text-sm text-zinc-600">
          A webhook-alapú lead-befogadás (11.2 fejezet) már működik: a CRM &rarr; Beállítások &rarr; Webhookok alatt
          generált egyedi URL-re küldött payload automatikusan új Opportunity-t hoz létre. Ez ugyanaz a mechanizmus,
          amit egy valós Meta Lead Ads webhook is használna.
        </p>
      </Card>
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm">
      {label}
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="font-medium text-zinc-700">{value}</p>
    </div>
  );
}
