import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { Card } from "@/components/ui";
import { formatHUF, isAccountLive } from "@/lib/enums";
import { MilestoneCelebration } from "@/components/portal/milestone-celebration";

const COMPLETED_STATUSES = ["ELESITVE", "KARBANTARTAS"];

export default async function PortalHomePage() {
  const accountId = (await getEffectiveAccountId())!;

  const [account, projects, latestReport, primaryContact] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.project.findMany({ where: { accountId } }),
    prisma.report.findFirst({ where: { accountId }, orderBy: { generatedAt: "desc" } }),
    prisma.contact.findFirst({ where: { accountId, isPrimary: true } }),
  ]);

  if (!account) return null;

  const completedProjects = projects.filter((p) => COMPLETED_STATUSES.includes(p.status));
  const activeProjects = projects.filter((p) => !COMPLETED_STATUSES.includes(p.status));
  const totalBudget = activeProjects.reduce((sum, p) => sum + p.budget, 0);
  const nextDeadline = activeProjects
    .map((p) => p.deadline)
    .filter((d): d is Date => d != null && d > new Date())
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const reportMetrics = latestReport
    ? (JSON.parse(latestReport.metrics) as { activeProjects?: number; completedProjects?: number; totalBudget?: number })
    : null;

  return (
    <div>
      {isAccountLive(account.lifecycleStage) ? <MilestoneCelebration accountId={account.id} /> : null}

      <h1 className="text-xl font-semibold text-zinc-900">Szép napot, {primaryContact?.fullName.split(" ")[0] ?? "!"}!</h1>
      <p className="mt-1 text-sm text-zinc-500">{account.name}</p>

      <h2 className="mt-5 text-sm font-semibold text-zinc-700">Projekt áttekintés</h2>

      <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Aktív projektek" value={String(activeProjects.length)} />
        <MetricCard label="Lezárt projektek" value={String(completedProjects.length)} />
        <MetricCard label="Összbüdzsé (folyamatban)" value={formatHUF(totalBudget)} />
        <MetricCard label="Legközelebbi határidő" value={nextDeadline ? nextDeadline.toLocaleDateString("hu-HU") : "—"} />
      </div>

      {reportMetrics ? (
        <Card className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Legutóbbi heti riport kivonata</h2>
            <Link href="/portal/riportok" className="text-xs font-medium text-emerald-600 hover:underline">
              Összes riport →
            </Link>
          </div>
          <p className="text-sm text-zinc-600">
            Aktív projektek: {reportMetrics.activeProjects ?? 0} · Lezárva: {reportMetrics.completedProjects ?? 0} · Összbüdzsé: {formatHUF(reportMetrics.totalBudget ?? 0)}
          </p>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink href="/portal/riportok" title="Riportok" desc="Heti automata riportok" />
        <QuickLink href="/portal/jovahagyasok" title="Kreatívok" desc="Jóváhagyásra váró anyagok" />
        <QuickLink href="/portal/uzenetek" title="Üzenetek" desc="Chat a The Code csapattal" />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </Card>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md">
      <p className="text-sm font-semibold text-emerald-700">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
    </Link>
  );
}
