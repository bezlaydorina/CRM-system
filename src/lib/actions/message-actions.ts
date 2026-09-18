"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession, getSession, getEffectiveAccountId } from "@/lib/auth";

export async function sendStaffMessageAction(accountId: string, formData: FormData) {
  const session = await requireStaffSession();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const conversation = await prisma.conversation.upsert({
    where: { accountId },
    create: { accountId },
    update: {},
  });
  await prisma.message.create({
    data: { conversationId: conversation.id, senderType: "STAFF", staffId: session.teamMemberId, body },
  });
  revalidatePath(`/admin/uzenetek/${accountId}`);
  revalidatePath("/admin/uzenetek");
  revalidatePath("/portal/uzenetek");
}

export async function sendClientMessageAction(formData: FormData) {
  const session = await getSession();
  const accountId = await getEffectiveAccountId();
  const body = String(formData.get("body") ?? "").trim();
  if (!body || !session || !accountId) return;

  const conversation = await prisma.conversation.upsert({
    where: { accountId },
    create: { accountId },
    update: {},
  });

  if (session.kind === "client") {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderType: "CLIENT", clientContactId: session.contactId, body },
    });
  } else {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderType: "STAFF", staffId: session.teamMemberId, body },
    });
  }

  revalidatePath(`/admin/uzenetek/${accountId}`);
  revalidatePath("/admin/uzenetek");
  revalidatePath("/portal/uzenetek");
}
