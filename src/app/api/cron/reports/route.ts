import { NextRequest, NextResponse } from "next/server";
import { runAutomaticReportsForAllAccounts } from "@/lib/report-generation";

/**
 * Vercel Cron hívja (lásd vercel.json "crons"): hetente a WEEK, havonta a MONTH
 * periódussal. Vercel Cron a hívásba `Authorization: Bearer <CRON_SECRET>`
 * headert tesz, ha a projektben be van állítva a CRON_SECRET env változó -
 * enélkül bárki meghívhatná ezt a végpontot és spam-riportokat generálhatna,
 * ezért CRON_SECRET nélkül (vagy hibás headerrel) mindig elutasítjuk.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[report-cron] CRON_SECRET nincs beállítva - a végpont le van tiltva.");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get("period");
  if (period !== "WEEK" && period !== "MONTH") {
    return NextResponse.json({ error: "Missing or invalid ?period= (WEEK|MONTH)" }, { status: 400 });
  }

  const results = await runAutomaticReportsForAllAccounts(period);
  return NextResponse.json({ period, count: results.length, results });
}
