import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Badge } from "@/components/ui";
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/kanban/kanban-board";
import { moveTaskColumn, reassignTaskAction } from "@/lib/actions/task-actions";
import { TASK_STATUS_COLUMNS, TASK_CATEGORIES, TASK_PRIORITIES, labelFor } from "@/lib/enums";
import { getCurrentTeamMember } from "@/lib/auth";
import { differenceInDays } from "date-fns";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string; category?: string }>;
}) {
  const { assignee: assigneeParam, category = "Mind" } = await searchParams;
  const me = await getCurrentTeamMember();
  const assignee = assigneeParam ?? me?.id ?? "all";

  const [teamMembers, allTasksForAssignee] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: {
        assigneeId: assignee === "all" ? undefined : assignee,
      },
      include: { assignee: true, account: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const categoryCounts = TASK_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = allTasksForAssignee.filter((t) => t.category === c).length;
    return acc;
  }, {});

  const tasks = category === "Mind" ? allTasksForAssignee : allTasksForAssignee.filter((t) => t.category === category);

  const columns: KanbanColumn[] = TASK_STATUS_COLUMNS.map((c) => ({
    id: c.key,
    title: c.label,
    accentColor: c.key === "BLOCKED" ? "#ef4444" : c.key === "WAITING" ? "#a1a1aa" : "#6366f1",
  }));

  const items: KanbanItem[] = tasks.map((t) => {
    const daysOpen = differenceInDays(new Date(), t.createdAt);
    return {
      id: t.id,
      columnId: t.statusColumn,
      node: (
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-800">{t.title}</p>
            <Badge color={t.priority === "URGENT" ? "red" : t.priority === "HIGH" ? "amber" : "gray"}>
              {labelFor(TASK_PRIORITIES, t.priority)}
            </Badge>
          </div>
          {t.description ? <p className="mt-1 text-xs text-zinc-500">{t.description}</p> : null}
          <p className="mt-1 text-xs text-zinc-400">
            {t.account ? (
              <Link href={`/admin/ugyfelek/${t.account.id}`} className="hover:underline">
                {t.account.name}
              </Link>
            ) : (
              "Belső"
            )}{" "}
            · {daysOpen === 0 ? "Ma" : `${daysOpen} napja nyitva`}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <Badge color="indigo">{t.category}</Badge>
            <form action={reassignTaskAction.bind(null, t.id)}>
              <select
                name="assigneeId"
                defaultValue={t.assigneeId ?? ""}
                className="rounded-md border border-zinc-200 bg-white px-1 py-0.5 text-[11px] text-zinc-600"
              >
                <option value="">Nincs felelős</option>
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </form>
          </div>
        </div>
      ),
    };
  });

  return (
    <div>
      <PageHeader
        title={assignee === "all" ? "Összes feladat" : `${teamMembers.find((t) => t.id === assignee)?.name ?? ""} feladatai`}
        subtitle="Trello-szerű Kanban tábla, öregedő (aging) feladatokkal"
        actions={
          <form className="flex items-center gap-2">
            <input type="hidden" name="category" value={category} />
            <select name="assignee" defaultValue={assignee} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
              <option value="all">Mind</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
            <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">Váltás</button>
          </form>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["Mind", ...TASK_CATEGORIES].map((c) => (
          <Link
            key={c}
            href={`/admin/feladatok?assignee=${assignee}&category=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              category === c ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {c} {c !== "Mind" ? `(${categoryCounts[c] ?? 0})` : `(${allTasksForAssignee.length})`}
          </Link>
        ))}
      </div>

      <KanbanBoard columns={columns} items={items} onMove={moveTaskColumn} />
    </div>
  );
}
