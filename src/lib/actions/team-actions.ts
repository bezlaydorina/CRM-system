"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const COLORS = ["#6366f1", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#ef4444"];

export async function createTeamMemberAction(formData: FormData) {
  const session = await requireStaffSession();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return;

  const passwordHash = await hashPassword("synkai123");
  await prisma.teamMember.create({
    data: {
      organizationId: session.organizationId,
      name,
      email,
      phone: String(formData.get("phone") ?? "") || null,
      jobRole: String(formData.get("jobRole") ?? "CSM"),
      passwordHash,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    },
  });
  revalidatePath("/admin/csapat");
}
