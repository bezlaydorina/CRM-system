"use server";

import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { formatHUF, PROJECT_STATUSES } from "@/lib/enums";
import { askClaude, type AssistantMessage } from "@/lib/claude";

const COMPLETED_STATUSES = ["ELESITVE", "KARBANTARTAS"];
const MAX_HISTORY = 10;

function projectStatusLabel(status: string) {
  return PROJECT_STATUSES.find((s) => s.key === status)?.label ?? status;
}

/**
 * Rule-based fallback, használva ha nincs ANTHROPIC_API_KEY beállítva, vagy a
 * Claude-hívás bármilyen okból sikertelen - sosem dob hibát, mindig válaszol.
 */
function askAssistantRuleBased(
  question: string,
  projects: { status: string; deadline: Date | null; title: string; budget: number }[],
  opportunities: { status: string }[]
): string {
  const q = question.toLowerCase();
  const activeProjects = projects.filter((p) => !COMPLETED_STATUSES.includes(p.status));
  const completedProjects = projects.filter((p) => COMPLETED_STATUSES.includes(p.status));
  const nextDeadlineProject = activeProjects
    .filter((p) => p.deadline != null && p.deadline > new Date())
    .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime())[0];

  if (q.includes("hogy mennek") || q.includes("teljesítmény") || q.includes("projekt")) {
    if (projects.length === 0) return "Még nincs rögzített projekted – amint elindul az első, itt azonnal látni fogod az állását.";
    return `Jelenleg ${activeProjects.length} aktív projekted van, ${completedProjects.length} már lezárva. ${
      nextDeadlineProject ? `A legközelebbi határidő: "${nextDeadlineProject.title}" – ${nextDeadlineProject.deadline!.toLocaleDateString("hu-HU")}.` : "Nincs közelgő határidő."
    }`;
  }

  if (q.includes("határidő") || q.includes("mikor")) {
    return nextDeadlineProject
      ? `A legközelebbi határidő "${nextDeadlineProject.title}" projekthez tartozik: ${nextDeadlineProject.deadline!.toLocaleDateString("hu-HU")}.`
      : "Jelenleg nincs közelgő határidős projekted.";
  }

  if (q.includes("lead") || q.includes("érdeklődő")) {
    const openCount = opportunities.filter((o) => o.status === "OPEN").length;
    return `A saját CRM-edben jelenleg ${openCount} nyitott lead van, összesen ${opportunities.length} rögzített érdeklődő. Nézd meg részletesen a CRM menüpontban!`;
  }

  if (q.includes("landing") || q.includes("tipp")) {
    return "Egy jól működő landing oldal tipp: egyetlen, világos cselekvésre ösztönző gomb (CTA) legyen a fold felett, és a headline pontosan azt az ígéretet mondja ki, amire a linkre kattintva az oldalra érkeztek.";
  }

  if (q.includes("büdzsé") || q.includes("koltseg") || q.includes("költség")) {
    const totalBudget = activeProjects.reduce((sum, p) => sum + p.budget, 0);
    return `Az aktív projektjeid összbüdzséje ${formatHUF(totalBudget)}.`;
  }

  return "Ezt a kérdést még nem tudom pontosan megválaszolni ebben a demóban – próbálj rákérdezni a projektjeid állására, a határidőkre, vagy a leadekre!";
}

export async function askAssistantAction(question: string, history: AssistantMessage[] = []): Promise<string> {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return "Nincs bejelentkezve ügyfél kontextus.";

  const [account, projects, opportunities, payments, pendingApprovals, latestReport] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.project.findMany({ where: { accountId } }),
    prisma.opportunity.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.payment.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.approvalItem.count({ where: { accountId, status: { in: ["PENDING_INTERNAL", "PENDING_CLIENT"] } } }),
    prisma.report.findFirst({ where: { accountId }, orderBy: { generatedAt: "desc" } }),
  ]);

  const activeProjects = projects.filter((p) => !COMPLETED_STATUSES.includes(p.status));
  const openOpportunities = opportunities.filter((o) => o.status === "OPEN");
  const unpaidPayments = payments.filter((p) => p.status !== "PAID");

  const systemPrompt = `Te vagy "The Code asszisztens", a The Code ügynökség CRM-jének ügyfélportálba épített chatbotja.
Kizárólag "${account?.name ?? "az ügyfél"}" saját, alább megadott adatai alapján válaszolj - semmilyen más ügyfél adatát nem ismered és nem is létezik számodra.
Magyarul válaszolj, tömören (legfeljebb 3-4 mondatban), barátságos de profi hangnemben.
Ha a kérdésre a megadott adatokból nem derül ki a válasz, mondd meg őszintén, és javasold, hogy keresse a csapatát élőben - ne találj ki adatot.

## ${account?.name ?? ""} jelenlegi állapota

Projektek (${projects.length} db, ebből ${activeProjects.length} aktív):
${projects.length === 0 ? "- nincs még rögzített projekt" : projects.map((p) => `- "${p.title}" (${p.category}) - ${projectStatusLabel(p.status)}, büdzsé: ${formatHUF(p.budget)}${p.deadline ? `, határidő: ${p.deadline.toLocaleDateString("hu-HU")}` : ""}`).join("\n")}

CRM leadek: ${opportunities.length} rögzített érdeklődő, ebből ${openOpportunities.length} nyitott.

Fizetések: ${payments.length} rögzített tétel, ebből ${unpaidPayments.length} nincs még kifizetve.

Jóváhagyásra váró elem (kreatív/landing/szöveg/kép): ${pendingApprovals} db.

${latestReport ? `Legutóbbi riport (${latestReport.generatedAt.toLocaleDateString("hu-HU")}): ${latestReport.metrics}` : "Még nincs generált riport."}`;

  const recentHistory = history.slice(-MAX_HISTORY);
  const claudeAnswer = await askClaude({
    system: systemPrompt,
    history: [...recentHistory, { role: "user", text: question }],
  });

  return claudeAnswer ?? askAssistantRuleBased(question, projects, opportunities);
}
