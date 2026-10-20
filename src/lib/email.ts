import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "The Code <onboarding@resend.dev>";

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Without RESEND_API_KEY (local dev, or before the user adds one in Vercel)
 * this logs instead of throwing, so every other flow keeps working.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY nincs beállítva – email kihagyva: "${subject}" -> ${to}`);
    return { skipped: true as const };
  }

  const result = await resend.emails.send({ from: FROM, to, subject, html });
  if (result.error) {
    console.error(`[email] Küldés sikertelen "${subject}" -> ${to}:`, result.error);
  }
  return result;
}
