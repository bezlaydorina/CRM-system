"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

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

  await prisma.contact.create({
    data: {
      accountId: session.accountId,
      fullName,
      email,
      canLoginPortal: true,
      accessLevel: String(formData.get("accessLevel") ?? "LIMITED"),
      passwordHash: await hashPassword("ugyfel123"),
    },
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
