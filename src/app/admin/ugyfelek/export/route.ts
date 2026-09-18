import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { lifecycleLabel } from "@/lib/enums";

export async function GET() {
  await requireStaffSession();
  const accounts = await prisma.account.findMany({ where: { isInternalSales: false }, orderBy: { name: "asc" } });

  const header = ["Cégnév", "Weboldal", "Iparág", "Státusz", "Életciklus", "Havi díj", "Hirdetés indult", "Forrás"];
  const rows = accounts.map((a) => [
    a.name,
    a.website ?? "",
    a.industry ?? "",
    a.status,
    lifecycleLabel(a.lifecycleStage),
    String(a.monthlyFee),
    a.adsLive ? "igen" : "nem",
    a.source ?? "",
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ugyfelek.csv",
    },
  });
}
