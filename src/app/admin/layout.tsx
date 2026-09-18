import { redirect } from "next/navigation";
import { getSession, getCurrentTeamMember, getImpersonatedAccountId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "staff") redirect("/login");

  const [member, impersonatedAccountId] = await Promise.all([
    getCurrentTeamMember(),
    getImpersonatedAccountId(),
  ]);
  if (!member) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { isInternalSales: false },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });

  const impersonatedAccount = impersonatedAccountId
    ? accounts.find((a) => a.id === impersonatedAccountId) ?? (await prisma.account.findUnique({ where: { id: impersonatedAccountId }, select: { id: true, name: true, status: true } }))
    : null;

  return (
    <AdminShell member={member} accounts={accounts} impersonatedAccount={impersonatedAccount}>
      {children}
    </AdminShell>
  );
}
