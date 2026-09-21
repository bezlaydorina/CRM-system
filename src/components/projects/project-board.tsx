"use client";

import Link from "next/link";
import { Badge, Avatar } from "@/components/ui";
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/kanban/kanban-board";
import { moveProjectStatus, reassignProjectAction, deleteProjectAction } from "@/lib/actions/project-actions";
import { PROJECT_STATUSES, formatHUF } from "@/lib/enums";

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  budget: number;
  deadline: string | null;
  account: { id: string; name: string };
  assignee: { id: string; name: string; avatarColor: string } | null;
};

export function ProjectBoard({
  categorySlug,
  projects,
  teamMembers,
}: {
  categorySlug: string;
  projects: ProjectRow[];
  teamMembers: { id: string; name: string }[];
}) {
  const columns: KanbanColumn[] = PROJECT_STATUSES.map((s) => ({ id: s.key, title: s.label, accentColor: s.color }));

  const items: KanbanItem[] = projects.map((p) => {
    const overdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== "ELESITVE" && p.status !== "KARBANTARTAS";
    return {
      id: p.id,
      columnId: p.status,
      node: (
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-800">{p.title}</p>
            <form action={deleteProjectAction.bind(null, p.id, categorySlug)}>
              <button className="text-xs text-zinc-300 hover:text-red-500" title="Törlés">
                ✕
              </button>
            </form>
          </div>
          <Link href={`/admin/ugyfelek/${p.account.id}`} className="text-xs text-indigo-600 hover:underline">
            {p.account.name}
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600">{p.budget > 0 ? formatHUF(p.budget) : "—"}</span>
            {p.deadline ? (
              <Badge color={overdue ? "red" : "gray"}>{new Date(p.deadline).toLocaleDateString("hu-HU")}</Badge>
            ) : null}
          </div>
          <form action={reassignProjectAction.bind(null, p.id, categorySlug)} className="mt-2">
            <select
              name="assigneeId"
              defaultValue={p.assignee?.id ?? ""}
              className="w-full rounded-md border border-zinc-200 bg-white px-1 py-0.5 text-[11px] text-zinc-600"
            >
              <option value="">Nincs felelős</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </form>
          {p.assignee ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Avatar name={p.assignee.name} color={p.assignee.avatarColor} size={5} />
              <span className="text-[11px] text-zinc-400">{p.assignee.name}</span>
            </div>
          ) : null}
        </div>
      ),
    };
  });

  return <KanbanBoard columns={columns} items={items} onMove={moveProjectStatus} />;
}
