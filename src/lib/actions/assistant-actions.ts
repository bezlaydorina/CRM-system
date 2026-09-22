"use server";

import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { formatHUF } from "@/lib/enums";

const COMPLETED_STATUSES = ["ELESITVE", "KARBANTARTAS"];

/**
 * Lightweight, rule-based stand-in for the spec's RAG-style AI assistant
 * (11.3 / 10. fejezet). Answers a handful of common questions from the
 * account's own live data. A real implementation would call an LLM
 * (Anthropic/OpenAI) with the account's data as retrieved context - no
 * such API key is available in this environment, so this keeps the same
 * "scoped to your own account's data" behaviour without a live model call.
 */
export async function askAssistantAction(question: string): Promise<string> {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return "Nincs bejelentkezve ügyfél kontextus.";

  const q = question.toLowerCase();
  const [projects, opportunities] = await Promise.all([
    prisma.project.findMany({ where: { accountId } }),
    prisma.opportunity.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

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

  if (q.includes("határidő") || q.includes("mikor"))  {
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
