"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";

export async function createCalendarEventAction(formData: FormData) {
  const session = await requireStaffSession();
  const title = String(formData.get("title") ?? "").trim();
  const startAtRaw = String(formData.get("startAt") ?? "");
  if (!title || !startAtRaw) return;

  const startAt = new Date(startAtRaw);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const teamMemberId = String(formData.get("teamMemberId") ?? "") || session.teamMemberId;
  const teamMember = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });

  await prisma.calendarEvent.create({
    data: {
      organizationId: session.organizationId,
      accountId: String(formData.get("accountId") ?? "") || null,
      teamMemberId,
      type: String(formData.get("type") ?? "CONVERSATION"),
      title,
      startAt,
      endAt,
      meetLink: teamMember?.googleCalendarConnected ? `https://meet.google.com/synk-${Math.random().toString(36).slice(2, 8)}` : null,
    },
  });
  revalidatePath("/admin/naptar");
}
