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

  const contact = session.kind === "client" ? await prisma.contact.findUnique({ where: { id: session.contactId } }) : null;

  return (
    <PortalShell account={account} contact={contact} isImpersonating={session.kind === "staff"}>
      {children}
    </PortalShell>
  );
}
