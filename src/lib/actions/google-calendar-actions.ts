"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { getGoogleAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";

export async function connectGoogleCalendarAction(teamMemberId: string) {
  await requireStaffSession();
  if (!isGoogleCalendarConfigured()) {
    redirect("/admin/csapat?error=google_not_configured");
  }
  redirect(getGoogleAuthUrl(teamMemberId));
}

export async function disconnectGoogleCalendarAction(teamMemberId: string) {
  await requireStaffSession();
  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: { googleCalendarConnected: false, googleRefreshToken: null, googleAccessToken: null, googleTokenExpiresAt: null },
  });
  revalidatePath("/admin/csapat");
}
