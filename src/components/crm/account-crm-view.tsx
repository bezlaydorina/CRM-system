import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { CrmSettingsPanel } from "@/components/crm/crm-settings-panel";
import { formatDistanceToNow, subDays } from "date-fns";
import { hu } from "date-fns/locale";

/**
 * The full mini-CRM (Pipeline / Kapcsolatok / Beállítások) for one Account.
 * Rendered both from the admin's "CRM és leadek" tab and from the client
 * portal's own "CRM" page - it is the same UI on both sides of the fence,
 * scoped only by which Account it is given (spec section 5 & 10).
 */
export async function AccountCrmView({
  accountId,
  view,
  pipelineIdParam,
}: {
  accountId: string;
  view: string;
  pipelineIdParam?: string;
}) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      pipelines: {
        orderBy: { createdAt: "asc" },
        include: { stages: { orderBy: { order: "asc" } }, customFieldDefs: { orderBy: { order: "asc" } }, webhooks: true },
      },
    },
  });
  if (!account) notFound();
  if (account.pipelines.length === 0) return <EmptyState text="Nincs pipeline beállítva" />;

  const activePipeline =
    account.pipelines.find((p) => p.id === pipelineIdParam) ?? account.pipelines.find((p) => p.isDefault) ?? account.pipelines[0];

  const opportunities = await prisma.opportunity.findMany({
    where: { stage: { pipelineId: activePipeline.id } },
    include: { _count: { select: { notes: true, taskReminders: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const last7 = opportunities.filter((o) => o.createdAt >= subDays(now, 7)).length;
  const last30 = opportunities.filter((o) => o.createdAt >= subDays(now, 30)).length;
  const today = opportunities.filter((o) => o.createdAt.toDateString() === now.toDateString()).length;
  const won = opportunities.filter((o) => o.status === "WON").length;
  const lost = opportunities.filter((o) => o.status === "LOST").length;
  const open = opportunities.filter((o) => o.status === "OPEN").length;
  const winRate = opportunities.length ? Math.round((won / opportunities.length) * 100) : 0;

  const sourceCounts = opportunities.reduce<Record<string, number>>((acc, o) => {
    const key = o.source ?? "ismeretlen";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {account.pipelines.map((p) => (
            <Link
              key={p.id}
              href={`?view=${view}&pipeline=${p.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                p.id === activePipeline.id ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {p.name} {p.isDefault ? "★" : ""}
            </Link>
          ))}
        </div>
        <div className="flex rounded-lg border border-zinc-300 p-0.5 text-sm">
          {[
            ["pipeline", "Pipeline"],
            ["contacts", "Kapcsolatok"],
            ["settings", "Beállítások"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`?view=${key}&pipeline=${activePipeline.id}`}
              className={`rounded-md px-3 py-1 ${view === key ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Összes" value={opportunities.length} />
        <Stat label="Nyitott" value={open} />
        <Stat label="Megnyert" value={won} />
        <Stat label="Elvesztett" value={lost} />
        <Stat label="Megnyerési arány" value={`${winRate}%`} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Ma érkezett" value={today} small />
        <Stat label="Utolsó 7 nap" value={last7} small />
        <Stat label="Utolsó 30 nap" value={last30} small />
      </div>

      {view === "pipeline" ? (
        <PipelineBoard
          accountId={accountId}
          stages={activePipeline.stages}
          opportunities={opportunities.map((o) => ({
            id: o.id,
            stageId: o.stageId,
            firstName: o.firstName,
            lastName: o.lastName,
            phone: o.phone,
            company: o.company,
            source: o.source,
            value: o.value,
            status: o.status,
            notesCount: o._count.notes,
            tasksCount: o._count.taskReminders,
          }))}
        />
      ) : null}

      {view === "contacts" ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Név</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telefon</th>
                <th className="px-4 py-2">Cég</th>
                <th className="px-4 py-2">Szakasz</th>
                <th className="px-4 py-2">Forrás</th>
                <th className="px-4 py-2">Létrehozva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {opportunities.map((o) => {
                const stage = activePipeline.stages.find((s) => s.id === o.stageId);
                return (
                  <tr key={o.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2 font-medium text-zinc-800">
                      {o.firstName} {o.lastName ?? ""}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{o.email ?? "—"}</td>
                    <td className="px-4 py-2 text-zinc-500">{o.phone ?? "—"}</td>
                    <td className="px-4 py-2 text-zinc-500">{o.company ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge color="indigo">{stage?.name}</Badge>
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{o.source ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-zinc-400">
                      {formatDistanceToNow(o.createdAt, { locale: hu, addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : null}

      {view === "settings" ? (
        <CrmSettingsPanel
          accountId={accountId}
          pipelines={account.pipelines}
          activePipeline={activePipeline}
          sourceCounts={sourceCounts}
          nameFormat={account.nameFormat}
          callButtonEnabled={account.callButtonEnabled}
          activity={await prisma.activityLogEntry.findMany({
            where: { accountId },
            orderBy: { createdAt: "desc" },
            take: 200,
            include: { actor: true },
          })}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <Card className={small ? "py-2" : undefined}>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={small ? "text-lg font-semibold" : "text-2xl font-semibold"}>{value}</p>
    </Card>
  );
}
