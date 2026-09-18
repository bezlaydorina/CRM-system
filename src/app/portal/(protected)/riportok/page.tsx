import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { formatHUF } from "@/lib/enums";
import { generateManualReportAction } from "@/lib/actions/report-actions";

export default async function PortalReportsPage() {
  const accountId = (await getEffectiveAccountId())!;
  const reports = await prisma.report.findMany({ where: { accountId }, orderBy: { generatedAt: "desc" } });
  const manualUsedThisMonth = reports.filter((r) => !r.isAutomatic && r.generatedAt.getMonth() === new Date().getMonth()).length;
  const manualRemaining = Math.max(0, 1 - manualUsedThisMonth);

  return (
    <div>
      <PageHeader
        title="Riportok"
        subtitle="Automatikusan generált heti riportok (hétfő 00:00) + korlátozott manuális riport"
        actions={
          <form action={generateManualReportAction}>
            <button
              disabled={manualRemaining === 0}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              title={manualRemaining === 0 ? "Nincs több manuális riport ebben a hónapban" : ""}
            >
              Manuális riport generálása ({manualRemaining} maradt)
            </button>
          </form>
        }
      />
      <Card className="divide-y divide-zinc-100 p-0">
        {reports.map((r) => {
          const metrics = JSON.parse(r.metrics) as Record<string, number>;
          return (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {r.period === "WEEK" ? "Heti riport" : "Havi riport"} · {r.generatedAt.toLocaleDateString("hu-HU")}
                </p>
                <p className="text-xs text-zinc-500">
                  Költés: {formatHUF(metrics.spend ?? 0)} · Lead: {metrics.leads ?? 0} · ROAS: {metrics.roas ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.isAutomatic ? <Badge color="gray">Automata</Badge> : <Badge color="indigo">Manuális</Badge>}
                <a href={`/report/${r.shareToken}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-600 hover:underline">
                  Megnyitás
                </a>
                <span className="text-xs text-zinc-400">Email</span>
              </div>
            </div>
          );
        })}
        {reports.length === 0 ? <EmptyState text="Még nincs riport" /> : null}
      </Card>
    </div>
  );
}
