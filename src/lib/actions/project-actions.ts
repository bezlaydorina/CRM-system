"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { PROJECT_STATUSES, PROJECT_CATEGORIES } from "@/lib/enums";

function revalidateProjectSurfaces(categorySlug: string) {
  revalidatePath(`/admin/projektek/${categorySlug}`);
}

export async function moveProjectStatus(projectId: string, newStatus: string) {
  await requireStaffSession();
  const valid = PROJECT_STATUSES.some((s) => s.key === newStatus);
  if (!valid) return;

  const project = await prisma.project.update({ where: { id: projectId }, data: { status: newStatus } });
  const category = PROJECT_CATEGORIES.find((c) => c.key === project.category);
  revalidateProjectSurfaces(category?.slug ?? "");
}

export async function createProjectAction(accountId: string, categoryKey: string, categorySlug: string, formData: FormData) {
  await requireStaffSession();
  const title = String(formData.get("title") ?? "").trim();
  if (!title || !accountId) return;

  await prisma.project.create({
    data: {
      accountId,
      category: categoryKey,
      title,
      description: String(formData.get("description") ?? "") || null,
      budget: Number(formData.get("budget") ?? 0),
      deadline: formData.get("deadline") ? new Date(String(formData.get("deadline"))) : null,
      assigneeId: String(formData.get("assigneeId") ?? "") || null,
    },
  });
  revalidateProjectSurfaces(categorySlug);
}

export async function reassignProjectAction(projectId: string, categorySlug: string, formData: FormData) {
  await requireStaffSession();
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  await prisma.project.update({ where: { id: projectId }, data: { assigneeId } });
  revalidateProjectSurfaces(categorySlug);
}

export async function deleteProjectAction(projectId: string, categorySlug: string) {
  await requireStaffSession();
  await prisma.project.delete({ where: { id: projectId } });
  revalidateProjectSurfaces(categorySlug);
}
