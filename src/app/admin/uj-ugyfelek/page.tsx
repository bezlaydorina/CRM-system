import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { hoursAgo } from "@/lib/date-helpers";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default async function NewAccountsTriagePage() {
  const accounts = await prisma.account.findMany({
    where: { isInternalSales: false, createdAt: { gt: hoursAgo(48) } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Új ügyfelek" subtitle="48 órás triage lista – 48 óra után automatikusan lekerülnek innen" />
      <Card className="divide-y divide-zinc-100 p-0">
        {accounts.map((a) => (
          <Link key={a.id} href={`/admin/ugyfelek/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50">
            <span className="text-sm font-medium text-zinc-800">{a.name}</span>
            <span className="flex items-center gap-2">
              <Badge color="indigo">{formatDistanceToNow(a.createdAt, { locale: hu, addSuffix: true })}</Badge>
            </span>
          </Link>
        ))}
        {accounts.length === 0 ? <EmptyState text="Nincs új ügyfél az utóbbi 48 órában" /> : null}
      </Card>
    </div>
  );
}
