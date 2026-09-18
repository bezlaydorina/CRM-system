"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { subDays } from "date-fns";

export async function generateManualReportAction() {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return;

  const usedThisMonth = await prisma.report.count({
    where: { accountId, isAutomatic: false, generatedAt: { gte: new Date(new Date().setDate(1)) } },
  });
  if (usedThisMonth >= 1) return;

  const snapshots = await prisma.adMetricSnapshot.findMany({ where: { accountId, date: { gte: subDays(new Date(), 7) } } });
  const spend = snapshots.reduce((s, x) => s + x.spend, 0);
  const impressions = snapshots.reduce((s, x) => s + x.impressions, 0);
  const clicks = snapshots.reduce((s, x) => s + x.clicks, 0);
  const leads = snapshots.reduce((s, x) => s + x.leads, 0);

  await prisma.report.create({
    data: {
      accountId,
      period: "WEEK",
      isAutomatic: false,
      metrics: JSON.stringify({ spend, impressions, clicks, leads, roas: spend ? (leads * 20000 / spend).toFixed(2) : "0" }),
    },
  });

  revalidatePath("/portal/riportok");
}
