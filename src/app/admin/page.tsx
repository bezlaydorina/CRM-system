import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui";
import { formatHUF, lifecycleLabel, labelFor, TASK_PRIORITIES } from "@/lib/enums";
import { hoursAgo, daysSince } from "@/lib/date-helpers";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default async function AdminDashboardPage() {
  const [accounts, urgentTasks, recentOpportunities, newAccounts] = await Promise.all([
    prisma.account.findMany({ where: { isInternalSales: false } }),
    prisma.task.findMany({
      where: { statusColumn: { not: "WAITING" } },
      orderBy: { dueAt: "asc" },
      take: 6,
      include: { assignee: true, account: true },
    }),
    prisma.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { stage: { include: { pipeline: { include: { account: true } } } } },
    }),
    prisma.account.findMany({
      where: { isInternalSales: false, createdAt: { gt: hoursAgo(48) } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE" && !a.isTestAccount);
  const liveAccounts = activeAccounts.filter((a) => a.adsLive);
  const mrr = liveAccounts.reduce((sum, a) => sum + a.monthlyFee, 0);
  const stuckAccounts = activeAccounts.filter((a) => {
    const days = daysSince(a.lifecycleEnteredAt);
    return days > 14 && a.lifecycleStage !== "ADS_LIVE" && a.lifecycleStage !== "RETAINED" && a.lifecycleStage !== "LOST";
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Synk AI Zrt. – ügynökségi áttekintés" />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-zinc-500">Aktív ügyfelek</p>
          <p className="mt-1 text-2xl font-semibold">{activeAccounts.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Élő hirdetéssel</p>
          <p className="mt-1 text-2xl font-semibold">{liveAccounts.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Havi MRR (aktív hirdetők)</p>
          <p className="mt-1 text-2xl font-semibold">{formatHUF(mrr)}</p>
        </Card>
        <Card className={stuckAccounts.length > 0 ? "border-amber-300 bg-amber-50" : ""}>
          <p className="text-xs font-medium text-zinc-500">Elakadt ügyfelek (&gt;14 napja)</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{stuckAccounts.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Beérkező leadek – összes ügyfél</h2>
            <Link href="/admin/crm" className="text-xs font-medium text-indigo-600 hover:underline">
              Összes megnyitása →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentOpportunities.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-zinc-800">
                    {o.firstName} {o.lastName}{" "}
                    <span className="text-zinc-400">· {o.stage.pipeline.account.name}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {o.company ?? "—"} · {o.email ?? o.phone ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {o.source ? <Badge color="blue">{o.source}</Badge> : null}
                  <span className="text-xs text-zinc-400">
                    {formatDistanceToNow(o.createdAt, { locale: hu, addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Sürgős feladatok</h2>
            <Link href="/admin/feladatok" className="text-xs font-medium text-indigo-600 hover:underline">
              Tábla →
            </Link>
          </div>
          <div className="space-y-2">
            {urgentTasks.map((t) => (
              <div key={t.id} className="rounded-lg border border-zinc-100 p-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">{t.title}</p>
                  <Badge color={t.priority === "URGENT" ? "red" : t.priority === "HIGH" ? "amber" : "gray"}>
                    {labelFor(TASK_PRIORITIES, t.priority)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {t.account?.name ?? "Belső"} {t.assignee ? <>· {t.assignee.name}</> : null}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {newAccounts.length > 0 ? (
        <Card className="mt-6 border-indigo-200 bg-indigo-50">
          <h2 className="mb-2 text-sm font-semibold text-indigo-800">Új ügyfelek (48 órás triage)</h2>
          <div className="flex flex-wrap gap-2">
            {newAccounts.map((a) => (
              <Link
                key={a.id}
                href={`/admin/ugyfelek/${a.id}`}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm hover:shadow"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {stuckAccounts.length > 0 ? (
        <Card className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Elakadt ügyfelek</h2>
          <div className="space-y-2">
            {stuckAccounts.map((a) => {
              const days = daysSince(a.lifecycleEnteredAt);
              return (
                <Link
                  key={a.id}
                  href={`/admin/ugyfelek/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                    <Avatar name={a.name} color="#6366f1" size={6} />
                    {a.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge color="gray">{lifecycleLabel(a.lifecycleStage)}</Badge>
                    <Badge color="red">−{days} nap</Badge>
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
