import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/email";

const TOKEN_TTL_DAYS = 7;

export async function createPortalSetupToken(contactId: string) {
  const { token } = await prisma.authToken.create({
    data: {
      purpose: "PORTAL_SET_PASSWORD",
      contactId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return `${getAppUrl()}/jelszo-beallitas/${token}`;
}

export async function createStaffSetupToken(teamMemberId: string) {
  const { token } = await prisma.authToken.create({
    data: {
      purpose: "STAFF_SET_PASSWORD",
      teamMemberId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return `${getAppUrl()}/jelszo-beallitas/${token}`;
}

export async function findValidAuthToken(token: string) {
  const record = await prisma.authToken.findUnique({
    where: { token },
    include: { contact: true, teamMember: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}
