import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatHUF } from "@/lib/enums";

type ProjectReportMetrics = {
  activeProjects?: number;
  completedProjects?: number;
  totalBudget?: number;
  nextDeadline?: string | null;
};

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { shareToken: token }, include: { account: true } });
  if (!report) notFound();

  const metrics = JSON.parse(report.metrics) as ProjectReportMetrics;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs font-medium uppercase text-brand-gold">The Code riport</p>
        <h1 className="mt-1 text-xl font-semibold text-brand-text">{report.account.name}</h1>
        <p className="text-sm text-zinc-500">{report.generatedAt.toLocaleDateString("hu-HU")} · {report.period === "WEEK" ? "Heti" : "Havi"} riport</p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Metric label="Aktív projektek" value={String(metrics.activeProjects ?? 0)} />
          <Metric label="Lezárt projektek" value={String(metrics.completedProjects ?? 0)} />
          <Metric label="Összbüdzsé" value={formatHUF(metrics.totalBudget ?? 0)} />
          <Metric
            label="Legközelebbi határidő"
            value={metrics.nextDeadline ? new Date(metrics.nextDeadline).toLocaleDateString("hu-HU") : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-brand-text">{value}</p>
    </div>
  );
}
