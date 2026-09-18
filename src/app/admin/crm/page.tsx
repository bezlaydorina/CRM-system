import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default async function GlobalCrmFeedPage() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { stage: { include: { pipeline: { include: { account: true } } } } },
  });

  return (
    <div>
      <PageHeader title="CRM – Beérkező leadek" subtitle="Minden ügyfél összes új leadje egy helyen" />
      <Card className="divide-y divide-zinc-100 p-0">
        {opportunities.map((o) => (
          <Link
            key={o.id}
            href={`/admin/ugyfelek/${o.accountId}/crm`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {o.firstName} {o.lastName} <span className="text-zinc-400">· {o.company ?? "—"}</span>
              </p>
              <p className="text-xs text-zinc-500">
                {o.stage.pipeline.account.name} · {o.email ?? o.phone ?? "nincs elérhetőség"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {o.source ? <Badge color="blue">{o.source}</Badge> : null}
              <Badge color="indigo">{o.stage.name}</Badge>
              <span className="w-24 text-right text-xs text-zinc-400">
                {formatDistanceToNow(o.createdAt, { locale: hu, addSuffix: true })}
              </span>
            </div>
          </Link>
        ))}
      </Card>
    </div>
  );
}
