import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { getAppUrl } from "@/lib/email";

/**
 * Google ide irányítja vissza a böngészőt a csatlakoztatási consent után.
 * A `state` a connectGoogleCalendarAction-ben beállított teamMemberId.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const teamMemberId = request.nextUrl.searchParams.get("state");
  const csapatUrl = `${getAppUrl()}/admin/csapat`;

  if (!code || !teamMemberId) {
    return NextResponse.redirect(`${csapatUrl}?error=google_failed`);
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens || !tokens.refresh_token) {
    // refresh_token csak akkor jön, ha a felhasználó még nem adta meg korábban a hozzájárulást
    // ezzel a kliens-azonosítóval (ezért kell a connect URL-ben prompt=consent).
    return NextResponse.redirect(`${csapatUrl}?error=google_failed`);
  }

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: {
      googleCalendarConnected: true,
      googleRefreshToken: tokens.refresh_token,
      googleAccessToken: tokens.access_token,
      googleTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return NextResponse.redirect(`${csapatUrl}?connected=1`);
}
