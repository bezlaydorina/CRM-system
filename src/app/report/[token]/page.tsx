import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatHUF } from "@/lib/enums";

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { shareToken: token }, include: { account: true } });
  if (!report) notFound();

  const metrics = JSON.parse(report.metrics) as Record<string, number>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs font-medium uppercase text-emerald-600">Synk AI riport</p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">{report.account.name}</h1>
        <p className="text-sm text-zinc-500">{report.generatedAt.toLocaleDateString("hu-HU")} · {report.period === "WEEK" ? "Heti" : "Havi"} riport</p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Metric label="Költés" value={formatHUF(metrics.spend ?? 0)} />
          <Metric label="Megjelenések" value={String(metrics.impressions ?? 0)} />
          <Metric label="Kattintások" value={String(metrics.clicks ?? 0)} />
          <Metric label="Lead" value={String(metrics.leads ?? 0)} />
          <Metric label="ROAS" value={String(metrics.roas ?? "—")} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
