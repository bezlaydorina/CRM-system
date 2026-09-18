import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatHUF, labelFor, PAYMENT_STATUSES } from "@/lib/enums";
import { addCredentialAction, updateAccountDetailsAction } from "@/lib/actions/account-actions";

export default async function AccountDataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      contacts: true,
      credentials: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!account) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Cég-azonosítók</h2>
          <form action={updateAccountDetailsAction.bind(null, id)} className="grid grid-cols-2 gap-3 text-sm">
            <label className="col-span-2">
              <span className="text-xs text-zinc-500">Weboldal</span>
              <input name="website" defaultValue={account.website ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5" />
            </label>
            <label>
              <span className="text-xs text-zinc-500">Iparág</span>
              <input name="industry" defaultValue={account.industry ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5" />
            </label>
            <label>
              <span className="text-xs text-zinc-500">Forrás</span>
              <input name="source" defaultValue={account.source ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5" />
            </label>
            <p className="col-span-2 text-xs text-zinc-500">Kapcsolattartók száma: {account.contacts.length}</p>
            <input type="hidden" name="isTestAccountField" value="1" />
            <label className="col-span-2 flex items-center gap-2 text-xs text-zinc-600">
              <input type="checkbox" name="isTestAccount" defaultChecked={account.isTestAccount} /> Teszt fiók (kizárja a riportokból)
            </label>
            <button className="col-span-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
          </form>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Belépési adatok</h2>
            <Badge color="red">BIZALMAS</Badge>
          </div>
          <div className="space-y-2">
            {account.credentials.length === 0 ? (
              <EmptyState text="Nincs rögzített belépési adat" />
            ) : (
              account.credentials.map((c) => (
                <div key={c.id} className="rounded-lg border border-zinc-100 px-3 py-2">
                  <p className="text-xs font-semibold text-zinc-600">{c.label}</p>
                  <p className="font-mono text-sm text-zinc-800">{c.value}</p>
                </div>
              ))
            )}
          </div>
          <form action={addCredentialAction.bind(null, id)} className="mt-3 grid grid-cols-3 gap-2">
            <input name="label" placeholder="Címke (pl. WP admin)" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
            <input name="value" placeholder="Érték" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
            <button className="rounded-lg bg-zinc-900 px-2 py-1.5 text-sm font-medium text-white">+ Hozzáad</button>
          </form>
        </Card>

        <Card className="border-dashed bg-zinc-50">
          <h2 className="mb-1 text-sm font-semibold text-zinc-600">Kitöltött űrlapválaszok</h2>
          <p className="text-xs text-zinc-500">
            Az &quot;Értékesítési felvétel&quot; és az &quot;Onboarding kérdőív&quot; dinamikus kérdés-válasz nézete ebben az MVP-ben
            nincs implementálva; a dinamikus egyéni mezők a mini-CRM Opportunity szintjén már működnek (lásd CRM
            és leadek fül), ugyanazzal a JSON-alapú séma-motorral bővíthető ide is.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Fizetési előzmények</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-zinc-400">
            <tr>
              <th className="py-1">Összeg</th>
              <th className="py-1">Típus</th>
              <th className="py-1">Állapot</th>
              <th className="py-1">Esedékesség</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {account.payments.map((p) => (
              <tr key={p.id}>
                <td className="py-1.5 font-medium">{formatHUF(p.amount)}</td>
                <td className="py-1.5 text-zinc-500">{p.type === "ONE_TIME" ? "Egyszeri" : p.type === "MONTHLY" ? "Havi" : "Előleg"}</td>
                <td className="py-1.5">
                  <Badge color={p.status === "PAID" ? "green" : p.status === "EXPIRED" ? "red" : "amber"}>
                    {labelFor(PAYMENT_STATUSES, p.status)}
                  </Badge>
                </td>
                <td className="py-1.5 text-zinc-500">{p.dueDate ? p.dueDate.toLocaleDateString("hu-HU") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {account.payments.length === 0 ? <EmptyState text="Nincs fizetési előzmény" /> : null}
      </Card>
    </div>
  );
}
