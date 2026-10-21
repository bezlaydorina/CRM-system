import { prisma } from "@/lib/prisma";
import { sendEmail, getAppUrl } from "@/lib/email";
import { reportEmail } from "@/lib/email-templates";
import { formatHUF, isAccountLive } from "@/lib/enums";

const COMPLETED_STATUSES = ["ELESITVE", "KARBANTARTAS"];

async function computeAccountMetrics(accountId: string) {
  const projects = await prisma.project.findMany({ where: { accountId } });
  const completedProjects = projects.filter((p) => COMPLETED_STATUSES.includes(p.status)).length;
  const activeProjects = projects.length - completedProjects;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const nextDeadline = projects
    .map((p) => p.deadline)
    .filter((d): d is Date => d != null && d > new Date())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return { activeProjects, completedProjects, totalBudget, nextDeadline: nextDeadline ? nextDeadline.toISOString() : null };
}

/**
 * A heti/havi automatikus riportot generálja ÉS rögtön ki is küldi a
 * elsődleges kapcsolattartónak - ez különbözteti meg a portál "Riport
 * készítése" gombjától (ami csak generál, a kiküldés ott külön lépés).
 * Sosem dob hibát - a hívó (cron route) fogja a visszaadott eredményt logolni.
 */
export async function generateAndEmailAutomaticReport(accountId: string, period: "WEEK" | "MONTH"): Promise<{ ok: boolean; reason?: string }> {
  try {
    const [account, primaryContact, metrics] = await Promise.all([
      prisma.account.findUnique({ where: { id: accountId } }),
      prisma.contact.findFirst({ where: { accountId, isPrimary: true } }),
      computeAccountMetrics(accountId),
    ]);
    if (!account) return { ok: false, reason: "account-not-found" };

    const report = await prisma.report.create({
      data: { accountId, period, isAutomatic: true, metrics: JSON.stringify(metrics) },
    });

    if (!primaryContact?.email) return { ok: false, reason: "no-primary-contact-email" };

    await sendEmail({
      to: primaryContact.email,
      subject: `${period === "WEEK" ? "Heti" : "Havi"} riport – ${account.name}`,
      html: reportEmail({
        accountName: account.name,
        reportUrl: `${getAppUrl()}/report/${report.shareToken}`,
        activeProjects: metrics.activeProjects,
        completedProjects: metrics.completedProjects,
        totalBudget: formatHUF(metrics.totalBudget),
      }),
    });

    await prisma.report.update({ where: { id: report.id }, data: { emailSentAt: new Date() } });
    return { ok: true };
  } catch (error) {
    console.error(`[report-cron] Riport sikertelen (${accountId}, ${period}):`, error);
    return { ok: false, reason: "error" };
  }
}

/**
 * Az összes aktív, élő ügyfélnek legenerálja és kiküldi a megadott periódusú
 * automatikus riportot - kihagyja, akinek már van ilyen riportja a jelenlegi
 * időszakra (hogy egy duplán lefutó cron hívás ne küldjön duplikált emailt).
 */
export async function runAutomaticReportsForAllAccounts(period: "WEEK" | "MONTH") {
  const periodStart = period === "WEEK" ? startOfWeek(new Date()) : startOfMonth(new Date());

  const accounts = await prisma.account.findMany({
    where: { status: "ACTIVE", isInternalSales: false, isTestAccount: false },
  });
  const liveAccounts = accounts.filter((a) => isAccountLive(a.lifecycleStage));

  const results: { accountId: string; accountName: string; ok: boolean; reason?: string }[] = [];
  for (const account of liveAccounts) {
    const alreadyGenerated = await prisma.report.count({
      where: { accountId: account.id, isAutomatic: true, period, generatedAt: { gte: periodStart } },
    });
    if (alreadyGenerated > 0) {
      results.push({ accountId: account.id, accountName: account.name, ok: true, reason: "already-generated" });
      continue;
    }
    const result = await generateAndEmailAutomaticReport(account.id, period);
    results.push({ accountId: account.id, accountName: account.name, ...result });
  }

  return results;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 7 : d.getDay(); // hétfő=1 ... vasárnap=7
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
