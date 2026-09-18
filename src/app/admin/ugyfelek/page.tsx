import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui";
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/kanban/kanban-board";
import { moveAccountStage } from "@/lib/actions/account-actions";
import { ACCOUNT_LIFECYCLE_STAGES, formatHUF } from "@/lib/enums";
import { paymentStatusBadge, daysInStage } from "@/lib/account-helpers";

export default async function UgyfelekPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; status?: string }>;
}) {
  const { view = "kanban", q = "", status = "ACTIVE" } = await searchParams;

  const accounts = await prisma.account.findMany({
    where: {
      isInternalSales: false,
      name: q ? { contains: q } : undefined,
      status: status === "ALL" ? undefined : status,
    },
    include: {
      payments: true,
      assignments: { include: { teamMember: true } },
    },
    orderBy: { name: "asc" },
  });

  const columns: KanbanColumn[] = ACCOUNT_LIFECYCLE_STAGES.map((s) => ({
    id: s.key,
    title: s.label,
    accentColor: s.key === "LOST" ? "#ef4444" : s.key === "ADS_LIVE" || s.key === "RETAINED" ? "#22c55e" : "#6366f1",
  }));

  const items: KanbanItem[] = accounts.map((a) => {
    const csm = a.assignments.find((x) => x.role === "CSM")?.teamMember;
    const badge = paymentStatusBadge(a.payments);
    const days = daysInStage(a.lifecycleEnteredAt);
    return {
      id: a.id,
      columnId: a.lifecycleStage,
      node: (
        <Link href={`/admin/ugyfelek/${a.id}`} className="block p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-800">{a.name}</p>
            <Badge color="red">−{days} nap</Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {a.assignments[0]?.teamMember.name ?? "Nincs kontakt"} {a.website ? `· ${a.website}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Badge color={badge.color}>{badge.label}</Badge>
            {a.isTestAccount ? <Badge color="purple">TESZT</Badge> : null}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex -space-x-1.5">
              {a.assignments.slice(0, 4).map((asg) => (
                <Avatar key={asg.id} name={asg.teamMember.name} color={asg.teamMember.avatarColor} size={6} />
              ))}
            </div>
            {csm ? <span className="text-[11px] text-zinc-400">CSM: {csm.name.split(" ")[0]}</span> : null}
          </div>
        </Link>
      ),
    };
  });

  return (
    <div>
      <PageHeader
        title="Ügyfelek"
        subtitle={`${accounts.length} ügyfél`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/ugyfelek/export"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              CSV export
            </Link>
            <Link
              href="/admin/ugyfelek/uj"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              + Új ügyfél
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <form className="flex items-center gap-2">
          <input type="hidden" name="view" value={view} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Keresés cégnév szerint..."
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select name="status" defaultValue={status} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            <option value="ACTIVE">Aktív</option>
            <option value="ARCHIVED">Archivált</option>
            <option value="ALL">Mind</option>
          </select>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">Szűrés</button>
        </form>

        <div className="flex rounded-lg border border-zinc-300 p-0.5 text-sm">
          <Link
            href={`/admin/ugyfelek?view=kanban&q=${q}&status=${status}`}
            className={`rounded-md px-3 py-1 ${view === "kanban" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          >
            Folyamat
          </Link>
          <Link
            href={`/admin/ugyfelek?view=list&q=${q}&status=${status}`}
            className={`rounded-md px-3 py-1 ${view === "list" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          >
            Lista
          </Link>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard columns={columns} items={items} onMove={moveAccountStage} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Cégnév</th>
                <th className="px-4 py-2">Iparág</th>
                <th className="px-4 py-2">Szakasz</th>
                <th className="px-4 py-2">Havi díj</th>
                <th className="px-4 py-2">Hirdetés</th>
                <th className="px-4 py-2">CSM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {accounts.map((a) => {
                const csm = a.assignments.find((x) => x.role === "CSM")?.teamMember;
                return (
                  <tr key={a.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2 font-medium text-zinc-800">
                      <Link href={`/admin/ugyfelek/${a.id}`} className="hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{a.industry ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge color="indigo">{ACCOUNT_LIFECYCLE_STAGES.find((s) => s.key === a.lifecycleStage)?.label}</Badge>
                    </td>
                    <td className="px-4 py-2">{formatHUF(a.monthlyFee)}</td>
                    <td className="px-4 py-2">{a.adsLive ? <Badge color="green">Fut</Badge> : <Badge color="gray">Nem</Badge>}</td>
                    <td className="px-4 py-2 text-zinc-500">{csm?.name ?? "—"}</td>
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
