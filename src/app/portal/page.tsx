import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { Card } from "@/components/ui";
import { formatHUF } from "@/lib/enums";
import { MilestoneCelebration } from "@/components/portal/milestone-celebration";
import { subDays } from "date-fns";

export default async function PortalHomePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const accountId = (await getEffectiveAccountId())!;
  const { period = "7" } = await searchParams;
  const days = period === "30" ? 30 : 7;

  const [account, snapshots, latestReport, primaryContact] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.adMetricSnapshot.findMany({ where: { accountId, date: { gte: subDays(new Date(), days) } } }),
    prisma.report.findFirst({ where: { accountId }, orderBy: { generatedAt: "desc" } }),
    prisma.contact.findFirst({ where: { accountId, isPrimary: true } }),
  ]);

  if (!account) return null;

  const totals = snapshots.reduce(
    (acc, s) => ({
      spend: acc.spend + s.spend,
      impressions: acc.impressions + s.impressions,
      clicks: acc.clicks + s.clicks,
      leads: acc.leads + s.leads,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0 }
  );
  const cpm = totals.impressions ? (totals.spend / totals.impressions) * 1000 : 0;
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpa = totals.leads ? totals.spend / totals.leads : 0;
  const reportMetrics = latestReport ? (JSON.parse(latestReport.metrics) as Record<string, number>) : null;

  return (
    <div>
      {account.adsLive ? <MilestoneCelebration accountId={account.id} /> : null}

      <h1 className="text-xl font-semibold text-zinc-900">Szép napot, {primaryContact?.fullName.split(" ")[0] ?? "!"}!</h1>
      <p className="mt-1 text-sm text-zinc-500">{account.name}</p>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-700">Hirdetési teljesítmény</h2>
        <div className="flex rounded-lg border border-zinc-300 p-0.5 text-xs">
          <Link href="?period=7" className={`rounded-md px-3 py-1 ${days === 7 ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
            7 nap
          </Link>
          <Link href="?period=30" className={`rounded-md px-3 py-1 ${days === 30 ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
            30 nap
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Költés" value={formatHUF(totals.spend)} sub={`CPM: ${cpm.toFixed(0)} Ft`} />
        <MetricCard label="Megjelenések" value={totals.impressions.toLocaleString("hu-HU")} />
        <MetricCard label="Kattintások" value={totals.clicks.toLocaleString("hu-HU")} sub={`CTR: ${ctr.toFixed(1)}%`} />
        <MetricCard label="Lead" value={String(totals.leads)} sub={`CPA: ${formatHUF(cpa)}`} />
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
            Költés: {formatHUF(reportMetrics.spend)} · Konverziók: {reportMetrics.leads} · ROAS: {reportMetrics.roas}
          </p>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink href="/portal/riportok" title="Riportok" desc="Heti automata riportok" />
        <QuickLink href="/portal/jovahagyasok" title="Kreatívok" desc="Jóváhagyásra váró anyagok" />
        <QuickLink href="/portal/uzenetek" title="Üzenetek" desc="Chat a Synk AI csapattal" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-zinc-400">{sub}</p> : null}
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
