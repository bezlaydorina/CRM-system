import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { TabLink } from "@/components/tab-link";
import { AccountActionsMenu } from "@/components/accounts/account-actions-menu";
import { differenceInMonths } from "date-fns";

export default async function AccountDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await prisma.account.findUnique({
    where: { id },
    include: { contacts: { where: { isPrimary: true } } },
  });
  if (!account) notFound();

  const months = account.startDate ? Math.max(0, differenceInMonths(new Date(), account.startDate)) : 0;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${account.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <h1 className="text-xl font-semibold text-zinc-900">{account.name}</h1>
            {account.isTestAccount ? <Badge color="purple">Teszt fiók</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {account.industry ?? "Iparág nincs megadva"} · {account.status === "ACTIVE" ? "Aktív" : "Archivált"} ·{" "}
            {months > 0 ? `${months} hónapja ügyfél` : "Új ügyfél"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/ugyfelek/${id}/adatok`} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
            Adatok
          </Link>
          <AccountActionsMenu accountId={id} primaryContactId={account.contacts[0]?.id} />
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b border-zinc-200">
        <TabLink href={`/admin/ugyfelek/${id}/attekintes`}>Áttekintés</TabLink>
        <TabLink href={`/admin/ugyfelek/${id}/crm`}>CRM és leadek</TabLink>
        <TabLink href={`/admin/ugyfelek/${id}/adatok`}>Adatok és űrlapok</TabLink>
        <TabLink href={`/admin/ugyfelek/${id}/meta`}>Meta és szolgáltatások</TabLink>
        <TabLink href={`/admin/ugyfelek/${id}/penzugy`}>Pénzügy</TabLink>
      </div>

      {children}
    </div>
  );
}
