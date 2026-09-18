import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { formatHUF } from "@/lib/enums";

export default async function SalesDashboardPage() {
  const salesAccount = await prisma.account.findFirst({
    where: { isInternalSales: true },
    include: { pipelines: { include: { stages: { orderBy: { order: "asc" } } } } },
  });

  if (!salesAccount) return <PageHeader title="Sales" subtitle="Nincs beállítva belső sales account" />;

  const pipeline = salesAccount.pipelines[0];
  const opportunities = await prisma.opportunity.findMany({
    where: { accountId: salesAccount.id },
    include: { _count: { select: { notes: true, taskReminders: true } } },
    orderBy: { createdAt: "desc" },
  });

  const won = opportunities.filter((o) => o.status === "WON");
  const totalWonValue = won.reduce((s, o) => s + o.value, 0);

  return (
    <div>
      <PageHeader title="Sales dashboard" subtitle="Synk AI Zrt. saját prospekt → ügyfél pipeline-ja" />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-zinc-500">Nyitott prospektek</p>
          <p className="text-2xl font-semibold">{opportunities.filter((o) => o.status === "OPEN").length}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Megnyert (fizető ügyfél)</p>
          <p className="text-2xl font-semibold">{won.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Megnyert érték összesen</p>
          <p className="text-2xl font-semibold">{formatHUF(totalWonValue)}</p>
        </Card>
      </div>
      <PipelineBoard
        accountId={salesAccount.id}
        stages={pipeline.stages}
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
    </div>
  );
}
