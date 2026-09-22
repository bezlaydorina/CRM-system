"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";

const COMPLETED_STATUSES = ["ELESITVE", "KARBANTARTAS"];

export async function generateManualReportAction() {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return;

  const usedThisMonth = await prisma.report.count({
    where: { accountId, isAutomatic: false, generatedAt: { gte: new Date(new Date().setDate(1)) } },
  });
  if (usedThisMonth >= 1) return;

  const projects = await prisma.project.findMany({ where: { accountId } });
  const completedProjects = projects.filter((p) => COMPLETED_STATUSES.includes(p.status)).length;
  const activeProjects = projects.length - completedProjects;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const nextDeadline = projects
    .map((p) => p.deadline)
    .filter((d): d is Date => d != null && d > new Date())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  await prisma.report.create({
    data: {
      accountId,
      period: "WEEK",
      isAutomatic: false,
      metrics: JSON.stringify({
        activeProjects,
        completedProjects,
        totalBudget,
        nextDeadline: nextDeadline ? nextDeadline.toISOString() : null,
      }),
    },
  });

  revalidatePath("/portal/riportok");
}
