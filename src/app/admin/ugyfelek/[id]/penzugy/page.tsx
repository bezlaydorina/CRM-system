import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatHUF } from "@/lib/enums";
import { updateAccountDetailsAction } from "@/lib/actions/account-actions";

export default async function AccountFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Összesített pénzügyi adatok</h2>
        <form action={updateAccountDetailsAction.bind(null, id)} className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Havi díj (Ft)" name="monthlyFee" defaultValue={account.monthlyFee} />
          <Field label="Setup díj (Ft)" name="setupFee" defaultValue={account.setupFee} />
          <Field label="Havi hirdetési keret (Ft)" name="monthlyAdBudget" defaultValue={account.monthlyAdBudget} />
          <button className="col-span-2 mt-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Állapot</h2>
        <dl className="space-y-1.5 text-sm">
          <Row label="Szerződés aláírva" value={account.contractSignedAt ? account.contractSignedAt.toLocaleDateString("hu-HU") : "Nincs aláírva"} />
          <Row label="Első/utolsó befizetés" value={account.lastPaymentAt ? account.lastPaymentAt.toLocaleDateString("hu-HU") : "—"} />
          <Row label="Kezdés" value={account.startDate ? account.startDate.toLocaleDateString("hu-HU") : "—"} />
          <Row label="Hirdetések állapota" value={account.adsLive ? "Futnak" : "Még nem indultak"} />
          <Row label="Éves díjbázis (havi × 12)" value={formatHUF(account.monthlyFee * 12)} />
        </dl>
      </Card>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label>
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-800">{value}</dd>
    </div>
  );
}
