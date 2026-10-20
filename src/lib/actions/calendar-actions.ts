"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

export async function createCalendarEventAction(formData: FormData) {
  const session = await requireStaffSession();
  const title = String(formData.get("title") ?? "").trim();
  const startAtRaw = String(formData.get("startAt") ?? "");
  if (!title || !startAtRaw) return;

  const startAt = new Date(startAtRaw);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const teamMemberId = String(formData.get("teamMemberId") ?? "") || session.teamMemberId;
  const teamMember = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });

  const googleEvent = teamMember?.googleCalendarConnected ? await createGoogleCalendarEvent({ teamMember, title, startAt, endAt }) : null;

  await prisma.calendarEvent.create({
    data: {
      organizationId: session.organizationId,
      accountId: String(formData.get("accountId") ?? "") || null,
      teamMemberId,
      type: String(formData.get("type") ?? "CONVERSATION"),
      title,
      startAt,
      endAt,
      meetLink: googleEvent?.meetLink ?? null,
      googleEventId: googleEvent?.googleEventId ?? null,
    },
  });
  revalidatePath("/admin/naptar");
}
