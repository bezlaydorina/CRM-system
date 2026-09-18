import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { PaymentsTable } from "@/components/finance/payments-table";
import { createPaymentAction } from "@/lib/actions/finance-actions";
import { formatHUF } from "@/lib/enums";
import { daysSince } from "@/lib/date-helpers";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "links" } = await searchParams;

  const [payments, accounts] = await Promise.all([
    prisma.payment.findMany({
      where: { account: { isInternalSales: false } },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.findMany({ where: { isInternalSales: false }, include: { payments: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Fizetések"
        subtitle="Fizetési linkek és pénzügyi rekonstrukciós áttekintés"
        actions={
          <div className="flex rounded-lg border border-zinc-300 p-0.5 text-sm">
            <Link href="?view=links" className={`rounded-md px-3 py-1 ${view === "links" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
              Payments
            </Link>
            <Link href="?view=reconciliation" className={`rounded-md px-3 py-1 ${view === "reconciliation" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
              Pénzügyi áttekintés
            </Link>
          </div>
        }
      />

      {view === "links" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <PaymentsTable payments={payments} />
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">+ Új fizetési link</h3>
            <form action={createPaymentAction} className="flex flex-col gap-2 text-sm">
              <select name="accountId" required className="rounded-lg border border-zinc-300 px-2 py-1.5">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input name="amount" type="number" placeholder="Összeg (Ft)" required className="rounded-lg border border-zinc-300 px-2 py-1.5" />
              <select name="type" className="rounded-lg border border-zinc-300 px-2 py-1.5">
                <option value="ONE_TIME">Egyszeri</option>
                <option value="MONTHLY">Havidíjas</option>
                <option value="DEPOSIT">Előleg</option>
              </select>
              <input name="dueDate" type="date" className="rounded-lg border border-zinc-300 px-2 py-1.5" />
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white">Létrehozás</button>
            </form>
          </Card>
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500">
            Havi bontású bevétel-összevezetés — a kézi rögzítésű tételek (setup, havi díj) és a tényleges befizetési
            események (Stripe/GHL/kézi jelölés) automatikus összevetése az elmúlt 45 napban.
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Ügyfél</th>
                <th className="px-4 py-2">Setup díj</th>
                <th className="px-4 py-2">Havi díj</th>
                <th className="px-4 py-2">Utolsó befizetés</th>
                <th className="px-4 py-2">Állapot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {accounts.map((a) => {
                const monthly = a.payments.filter((p) => p.type === "MONTHLY").sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())[0];
                const paymentDaysAgo = a.lastPaymentAt ? daysSince(a.lastPaymentAt) : null;
                let flag: { label: string; color: "red" | "amber" | "green" } = { label: "Rendben", color: "green" };
                if (monthly?.status === "EXPIRED") flag = { label: "Valós kitettség – utánanézendő", color: "red" };
                else if (monthly?.status === "PENDING") flag = { label: "Könyvelési elmaradás", color: "amber" };

                return (
                  <tr key={a.id}>
                    <td className="px-4 py-2 font-medium text-zinc-800">{a.name}</td>
                    <td className="px-4 py-2">{formatHUF(a.setupFee)}</td>
                    <td className="px-4 py-2">{formatHUF(a.monthlyFee)}</td>
                    <td className="px-4 py-2 text-zinc-500">{paymentDaysAgo != null ? `${paymentDaysAgo} napja` : "—"}</td>
                    <td className="px-4 py-2">
                      <Badge color={flag.color}>{flag.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
