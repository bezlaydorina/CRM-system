import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/email";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function isGoogleCalendarConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

function redirectUri() {
  return `${getAppUrl()}/api/google-calendar/callback`;
}

/** teamMemberId a `state` paraméterben utazik, hogy a callback tudja, kihez kötjük a tokeneket. */
export function getGoogleAuthUrl(teamMemberId: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: teamMemberId,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse | null> {
  if (!isGoogleCalendarConfigured()) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    console.error("[google-calendar] Token csere sikertelen:", await res.text());
    return null;
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[google-calendar] Token frissítés sikertelen:", await res.text());
    return null;
  }
  return res.json();
}

type TeamMemberTokens = {
  id: string;
  googleRefreshToken: string | null;
  googleAccessToken: string | null;
  googleTokenExpiresAt: Date | null;
};

async function getValidAccessToken(member: TeamMemberTokens): Promise<string | null> {
  if (!member.googleRefreshToken) return null;

  const stillValid = member.googleAccessToken && member.googleTokenExpiresAt && member.googleTokenExpiresAt > new Date();
  if (stillValid) return member.googleAccessToken;

  const refreshed = await refreshAccessToken(member.googleRefreshToken);
  if (!refreshed) return null;

  await prisma.teamMember.update({
    where: { id: member.id },
    data: {
      googleAccessToken: refreshed.access_token,
      googleTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });
  return refreshed.access_token;
}

type CreateEventParams = {
  teamMember: TeamMemberTokens;
  title: string;
  startAt: Date;
  endAt: Date;
};

type CreateEventResult = { googleEventId: string; meetLink: string | null };

/**
 * Nélküle (nincs GOOGLE_CLIENT_ID/SECRET, vagy a csapattag nincs csatlakoztatva, vagy a
 * Google API hibát ad) null-t ad vissza - a hívó fél ekkor a régi "nincs Meet link" állapotot
 * mutatja, nem omlik össze.
 */
export async function createGoogleCalendarEvent(params: CreateEventParams): Promise<CreateEventResult | null> {
  if (!isGoogleCalendarConfigured()) return null;

  const accessToken = await getValidAccessToken(params.teamMember);
  if (!accessToken) return null;

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: params.title,
      start: { dateTime: params.startAt.toISOString() },
      end: { dateTime: params.endAt.toISOString() },
      conferenceData: {
        createRequest: { requestId: `${params.teamMember.id}-${Date.now()}`, conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
    }),
  });

  if (!res.ok) {
    console.error("[google-calendar] Esemény létrehozása sikertelen:", await res.text());
    return null;
  }

  const data = await res.json();
  return { googleEventId: data.id, meetLink: data.hangoutLink ?? null };
}
