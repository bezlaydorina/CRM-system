"use client";

import { useState } from "react";
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/kanban/kanban-board";
import { OpportunityDrawer } from "./opportunity-drawer";
import { QuickAddOpportunity } from "./quick-add-opportunity";
import { Badge } from "@/components/ui";
import { moveOpportunityStage } from "@/lib/actions/crm-actions";
import { formatHUF } from "@/lib/enums";

type Stage = { id: string; name: string; color: string };
type Opportunity = {
  id: string;
  stageId: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  value: number;
  status: string;
  notesCount: number;
  tasksCount: number;
};

export function PipelineBoard({
  accountId,
  stages,
  opportunities,
}: {
  accountId: string;
  stages: Stage[];
  opportunities: Opportunity[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const columns: KanbanColumn[] = stages.map((s) => ({ id: s.id, title: s.name, accentColor: s.color }));

  const items: KanbanItem[] = opportunities.map((o) => ({
    id: o.id,
    columnId: o.stageId,
    node: (
      <div onClick={() => setSelected(o.id)} className="cursor-pointer p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {o.firstName} {o.lastName ?? ""}
          </p>
          {o.status !== "OPEN" ? (
            <Badge color={o.status === "WON" ? "green" : "red"}>{o.status === "WON" ? "Megnyert" : "Elveszett"}</Badge>
          ) : null}
        </div>
        <p className="text-xs text-zinc-500">{o.company ?? o.phone ?? "—"}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1">{o.source ? <Badge color="blue">{o.source}</Badge> : null}</div>
          <span className="text-xs font-medium text-zinc-600">{formatHUF(o.value)}</span>
        </div>
        {o.notesCount || o.tasksCount ? (
          <div className="mt-1.5 flex gap-3 text-[11px] text-zinc-400">
            {o.notesCount ? <span>📝 {o.notesCount}</span> : null}
            {o.tasksCount ? <span>✅ {o.tasksCount}</span> : null}
          </div>
        ) : null}
      </div>
    ),
  }));

  return (
    <div>
      <div className="mb-3 flex gap-3 overflow-x-auto">
        {stages.map((s) => (
          <div key={s.id} className="w-72 flex-shrink-0">
            <QuickAddOpportunity accountId={accountId} stageId={s.id} />
          </div>
        ))}
      </div>
      <KanbanBoard columns={columns} items={items} onMove={moveOpportunityStage} />
      {selected ? <OpportunityDrawer opportunityId={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
