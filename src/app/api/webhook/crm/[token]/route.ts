import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Generic inbound lead-capture endpoint (spec 11.2 / 5. CRM Beállítások →
 * Webhookok). Any external system (form builder, Zapier/Make, a landing
 * page) can POST an arbitrary JSON payload here; it becomes a new
 * Opportunity in the pipeline/stage the webhook was configured for.
 *
 * Recognised top-level keys (all optional): firstName/first_name/name,
 * lastName/last_name, email, phone, company, value. Anything else is kept
 * as a custom field, matched by name against the pipeline's custom field
 * definitions when possible.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const webhook = await prisma.webhook.findUnique({
    where: { token },
    include: { pipeline: { include: { customFieldDefs: true } } },
  });
  if (!webhook) {
    return NextResponse.json({ error: "Unknown webhook token" }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v : v != null ? String(v) : undefined);
  const firstName = str(payload.firstName ?? payload.first_name ?? payload.name) ?? "Webhook";
  const lastName = str(payload.lastName ?? payload.last_name);
  const email = str(payload.email);
  const phone = str(payload.phone ?? payload.telefon);
  const company = str(payload.company ?? payload.cegnev);
  const value = Number(payload.value ?? 0) || 0;

  const knownKeys = new Set(["firstName", "first_name", "name", "lastName", "last_name", "email", "phone", "telefon", "company", "cegnev", "value"]);
  const customFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (knownKeys.has(key)) continue;
    const matchingDef = webhook.pipeline.customFieldDefs.find((d) => d.name.toLowerCase() === key.toLowerCase());
    customFields[matchingDef ? matchingDef.id : `raw_${key}`] = val;
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      accountId: webhook.accountId,
      stageId: webhook.stageId,
      firstName,
      lastName,
      email,
      phone,
      company,
      opportunityName: `${firstName}${lastName ? " " + lastName : ""} – ${webhook.name}`,
      value,
      source: str(payload.source) ?? webhook.name,
      customFields: JSON.stringify(customFields),
    },
  });

  await prisma.activityLogEntry.create({
    data: {
      accountId: webhook.accountId,
      opportunityId: opportunity.id,
      type: "WEBHOOK_IN",
      message: `Új lead érkezett a "${webhook.name}" webhookon keresztül`,
    },
  });

  return NextResponse.json({ ok: true, opportunityId: opportunity.id }, { status: 201 });
}
