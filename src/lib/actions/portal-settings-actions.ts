"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { portalInviteEmail } from "@/lib/email-templates";
import { createPortalSetupToken } from "@/lib/auth-tokens";

export async function updateOwnProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.kind !== "client") return;
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return;

  await prisma.contact.update({
    where: { id: session.contactId },
    data: { fullName, phone: String(formData.get("phone") ?? "") || null },
  });
  revalidatePath("/portal/beallitasok");
}

export async function invitePortalTeammateAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.kind !== "client") return;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!fullName || !email) return;

  const account = await prisma.account.findUnique({ where: { id: session.accountId } });
  const contact = await prisma.contact.create({
    data: {
      accountId: session.accountId,
      fullName,
      email,
      canLoginPortal: false,
      accessLevel: String(formData.get("accessLevel") ?? "LIMITED"),
    },
  });

  const setupUrl = await createPortalSetupToken(contact.id);
  await sendEmail({
    to: email,
    subject: `Meghívó – ${account?.name ?? "The Code"} ügyfélportál`,
    html: portalInviteEmail({ contactName: fullName, accountName: account?.name ?? "The Code", setupUrl }),
  });

  revalidatePath("/portal/beallitasok");
}

export async function removePortalTeammateAction(contactId: string) {
  const session = await getSession();
  if (!session || session.kind !== "client") return;
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.accountId !== session.accountId || contact.isPrimary) return;
  await prisma.contact.delete({ where: { id: contactId } });
  revalidatePath("/portal/beallitasok");
}
