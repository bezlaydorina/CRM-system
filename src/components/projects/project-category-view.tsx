import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, EmptyState } from "@/components/ui";
import { projectCategoryBySlug, formatHUF } from "@/lib/enums";
import { ProjectBoard } from "./project-board";
import { QuickAddProject } from "./quick-add-project";

export async function ProjectCategoryView({ categorySlug }: { categorySlug: string }) {
  const category = projectCategoryBySlug(categorySlug);
  if (!category) notFound();

  const [projects, accounts, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: { category: category.key },
      include: { account: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.findMany({ where: { isInternalSales: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.teamMember.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const active = projects.filter((p) => p.status !== "ELESITVE" && p.status !== "KARBANTARTAS");
  const launched = projects.filter((p) => p.status === "ELESITVE" || p.status === "KARBANTARTAS");
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div>
      <PageHeader
        title={category.label}
        subtitle="Projekt-nyilvántartás – igényfelméréstől az élesítésig"
        actions={<QuickAddProject categoryKey={category.key} categorySlug={categorySlug} accounts={accounts} teamMembers={teamMembers} />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-zinc-500">Összes projekt</p>
          <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Folyamatban</p>
          <p className="mt-1 text-2xl font-semibold">{active.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Élesítve / karbantartva</p>
          <p className="mt-1 text-2xl font-semibold">{launched.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Összbüdzsé</p>
          <p className="mt-1 text-2xl font-semibold">{formatHUF(totalBudget)}</p>
        </Card>
      </div>

      {projects.length === 0 ? (
        <EmptyState text="Még nincs projekt ebben a kategóriában – hozz létre egyet a fenti gombbal." />
      ) : (
        <ProjectBoard
          categorySlug={categorySlug}
          projects={projects.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            budget: p.budget,
            deadline: p.deadline ? p.deadline.toISOString() : null,
            account: p.account,
            assignee: p.assignee,
          }))}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
