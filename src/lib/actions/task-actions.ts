"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { TASK_STATUS_COLUMNS } from "@/lib/enums";

export async function moveTaskColumn(taskId: string, newColumn: string) {
  await requireStaffSession();
  const valid = TASK_STATUS_COLUMNS.some((c) => c.key === newColumn);
  if (!valid) return;
  await prisma.task.update({ where: { id: taskId }, data: { statusColumn: newColumn } });
  revalidatePath("/admin/feladatok");
}

export async function reassignTaskAction(taskId: string, formData: FormData) {
  await requireStaffSession();
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  await prisma.task.update({ where: { id: taskId }, data: { assigneeId } });
  revalidatePath("/admin/feladatok");
}

export async function createTaskAction(formData: FormData) {
  const session = await requireStaffSession();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.task.create({
    data: {
      organizationId: session.organizationId,
      accountId: String(formData.get("accountId") ?? "") || null,
      title,
      description: String(formData.get("description") ?? "") || null,
      category: String(formData.get("category") ?? "Egyéb"),
      priority: String(formData.get("priority") ?? "MEDIUM"),
      assigneeId: String(formData.get("assigneeId") ?? "") || null,
      statusColumn: "ASSIGNED",
    },
  });
  revalidatePath("/admin/feladatok");
}
