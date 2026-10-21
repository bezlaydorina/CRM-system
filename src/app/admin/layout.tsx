import { redirect } from "next/navigation";
import { getSession, getCurrentTeamMember, getImpersonatedAccountId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { resolveFileUrls } from "@/lib/storage";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "staff") redirect("/login");

  const [member, impersonatedAccountId] = await Promise.all([
    getCurrentTeamMember(),
    getImpersonatedAccountId(),
  ]);
  if (!member) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: member.organizationId },
    select: { name: true, logoUrl: true, primaryColor: true },
  });

  const accounts = await prisma.account.findMany({
    where: { isInternalSales: false },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });

  const impersonatedAccount = impersonatedAccountId
    ? accounts.find((a) => a.id === impersonatedAccountId) ?? (await prisma.account.findUnique({ where: { id: impersonatedAccountId }, select: { id: true, name: true, status: true } }))
    : null;

  const logoDisplayUrl = org?.logoUrl ? (await resolveFileUrls([org.logoUrl], 60 * 60 * 24))[org.logoUrl] ?? null : null;

  return (
    <AdminShell member={member} accounts={accounts} impersonatedAccount={impersonatedAccount} org={{ name: org?.name ?? "The Code", logoUrl: logoDisplayUrl, primaryColor: org?.primaryColor ?? null }}>
      {children}
    </AdminShell>
  );
}
