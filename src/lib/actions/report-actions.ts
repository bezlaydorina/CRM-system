"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { sendEmail, getAppUrl } from "@/lib/email";
import { reportEmail } from "@/lib/email-templates";
import { formatHUF } from "@/lib/enums";

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

export async function emailReportAction(reportId: string) {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return;

  const [report, primaryContact] = await Promise.all([
    prisma.report.findFirst({ where: { id: reportId, accountId }, include: { account: true } }),
    prisma.contact.findFirst({ where: { accountId, isPrimary: true } }),
  ]);
  if (!report || !primaryContact?.email) return;

  const metrics = JSON.parse(report.metrics) as { activeProjects?: number; completedProjects?: number; totalBudget?: number };
  await sendEmail({
    to: primaryContact.email,
    subject: `Heti riport – ${report.account.name}`,
    html: reportEmail({
      accountName: report.account.name,
      reportUrl: `${getAppUrl()}/report/${report.shareToken}`,
      activeProjects: metrics.activeProjects ?? 0,
      completedProjects: metrics.completedProjects ?? 0,
      totalBudget: formatHUF(metrics.totalBudget ?? 0),
    }),
  });

  await prisma.report.update({ where: { id: reportId }, data: { emailSentAt: new Date() } });
  revalidatePath("/portal/riportok");
}
