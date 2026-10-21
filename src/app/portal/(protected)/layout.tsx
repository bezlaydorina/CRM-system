import { redirect } from "next/navigation";
import { getSession, getEffectiveAccountId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalShell } from "@/components/portal-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/portal/login");

  const accountId = await getEffectiveAccountId();
  if (!accountId) {
    // Staff logged in but not impersonating anyone yet.
    redirect("/admin");
  }

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) redirect("/admin");

  const [contact, org] = await Promise.all([
    session.kind === "client" ? prisma.contact.findUnique({ where: { id: session.contactId } }) : null,
    prisma.organization.findUnique({ where: { id: account.organizationId }, select: { primaryColor: true } }),
  ]);

  return (
    <PortalShell account={account} contact={contact} isImpersonating={session.kind === "staff"} primaryColor={org?.primaryColor ?? null}>
      {children}
    </PortalShell>
  );
}
