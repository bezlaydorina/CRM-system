"use server";

import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { formatHUF } from "@/lib/enums";
import { subDays } from "date-fns";

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
  const [account, snapshots, opportunities] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.adMetricSnapshot.findMany({ where: { accountId, date: { gte: subDays(new Date(), 30) } } }),
    prisma.opportunity.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const last7 = snapshots.filter((s) => s.date >= subDays(new Date(), 7));
  const spend7 = last7.reduce((s, x) => s + x.spend, 0);
  const leads7 = last7.reduce((s, x) => s + x.leads, 0);

  if (q.includes("hogy mennek") || q.includes("teljesítmény") || q.includes("hirdet")) {
    if (!account?.adsLive) return "A hirdetéseid még nem indultak el, így nincs friss teljesítmény adat – amint elindulnak, itt azonnal látni fogod az eredményeket.";
    return `Az elmúlt 7 napban ${formatHUF(spend7)} költés mellett ${leads7} lead érkezett. Ez alapban jó irányban áll, ha kérdésed van egy adott kampányról, kérdezz rá konkrétan!`;
  }

  if (q.includes("legtöbbet") || q.includes("legjobb") || q.includes("kampány")) {
    return leads7 > 0
      ? `Az utolsó 7 napban összesen ${leads7} lead érkezett ${formatHUF(spend7)} költésből – ez átlagosan ${formatHUF(leads7 ? spend7 / leads7 : 0)} / lead. Kampány-szintű bontás a Winner Ads modulban lesz elérhető.`
      : "Még nincs elég adat a kampányok összehasonlításához.";
  }

  if (q.includes("lead") || q.includes("érdeklődő")) {
    const openCount = opportunities.filter((o) => o.status === "OPEN").length;
    return `A saját CRM-edben jelenleg ${openCount} nyitott lead van, összesen ${opportunities.length} rögzített érdeklődő. Nézd meg részletesen a CRM menüpontban!`;
  }

  if (q.includes("landing") || q.includes("tipp")) {
    return "Egy jól működő landing oldal tipp: egyetlen, világos cselekvésre ösztönző gomb (CTA) legyen a fold felett, és a headline pontosan azt az ígéretet mondja ki, amire a hirdetésben kattintottak.";
  }

  return "Ezt a kérdést még nem tudom pontosan megválaszolni ebben a demóban – próbálj rákérdezni a hirdetési teljesítményre, a leadekre, vagy kérj egy landing page tippet!";
}
