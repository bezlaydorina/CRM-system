import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { ApprovalQueue } from "@/components/approvals/approval-queue";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { APPROVAL_TYPES } from "@/lib/enums";
import { createApprovalItemAction } from "@/lib/actions/approval-actions";

export default async function CsmApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; state?: string; accountId?: string }>;
}) {
  const { type = "CREATIVE", state = "internal", accountId = "" } = await searchParams;

  const [items, accounts] = await Promise.all([
    prisma.approvalItem.findMany({
      where: {
        type,
        accountId: accountId || undefined,
        status: state === "internal" ? { in: ["PENDING_INTERNAL", "DRAFT"] } : "PENDING_CLIENT",
      },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.findMany({ where: { isInternalSales: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="CSM Jóváhagyás" subtitle="Belső minőségkapu az ügyfélnek kiküldött tartalmakhoz" />

      <Card className="mb-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">+ Új jóváhagyásra váró tétel</h2>
        <form action={createApprovalItemAction} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <select name="accountId" required defaultValue="" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            <option value="" disabled>
              Ügyfél...
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input name="title" placeholder="Cím (pl. Nyitóoldal – bannerkép v2)" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm sm:col-span-2" />
          <select name="type" defaultValue="CREATIVE" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            {APPROVAL_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <input name="file" type="file" accept="image/*,video/*" required className="rounded-lg border border-zinc-300 px-2 py-1 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs" />
          <button className="rounded-lg bg-brand-gold px-3 py-1.5 text-sm font-semibold text-white sm:col-span-5">+ Feltöltés jóváhagyásra</button>
        </form>
      </Card>

      <div className="mb-3 flex flex-wrap gap-2">
        {APPROVAL_TYPES.map((t) => (
          <Link
            key={t.key}
            href={`/admin/jovahagyas?type=${t.key}&state=${state}&accountId=${accountId}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              type === t.key ? "bg-brand-gold text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex rounded-lg border border-zinc-300 p-0.5 text-sm">
          <Link href={`/admin/jovahagyas?type=${type}&state=internal&accountId=${accountId}`} className={`rounded-md px-3 py-1 ${state === "internal" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
            Nálam áll
          </Link>
          <Link href={`/admin/jovahagyas?type=${type}&state=client&accountId=${accountId}`} className={`rounded-md px-3 py-1 ${state === "client" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
            Ügyfélnél áll
          </Link>
        </div>
        <form>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="state" value={state} />
          <AutoSubmitSelect name="accountId" defaultValue={accountId} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            <option value="">Összes ügyfél</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </form>
      </div>

      <ApprovalQueue
        mode="staff"
        items={items.map((i) => ({
          id: i.id,
          title: i.title,
          type: i.type,
          status: i.status,
          fileUrl: i.fileUrl,
          accountName: i.account.name,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
