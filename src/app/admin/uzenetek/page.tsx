import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default async function StaffMessagesPage() {
  const conversations = await prisma.conversation.findMany({
    where: { account: { isInternalSales: false } },
    include: {
      account: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const sorted = conversations.sort((a, b) => {
    const at = a.messages[0]?.createdAt.getTime() ?? 0;
    const bt = b.messages[0]?.createdAt.getTime() ?? 0;
    return bt - at;
  });

  return (
    <div>
      <PageHeader title="Üzenetek" subtitle="Ügyfél beszélgetések egy helyen" />
      <Card className="divide-y divide-zinc-100 p-0">
        {sorted.map((c) => (
          <Link key={c.id} href={`/admin/uzenetek/${c.accountId}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50">
            <div>
              <p className="text-sm font-medium text-zinc-800">{c.account.name}</p>
              <p className="max-w-md truncate text-xs text-zinc-500">{c.messages[0]?.body ?? "Nincs üzenet még"}</p>
            </div>
            {c.messages[0] ? (
              <span className="text-xs text-zinc-400">{formatDistanceToNow(c.messages[0].createdAt, { locale: hu, addSuffix: true })}</span>
            ) : null}
          </Link>
        ))}
        {sorted.length === 0 ? <EmptyState text="Nincs beszélgetés" /> : null}
      </Card>
    </div>
  );
}
