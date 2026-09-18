import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-only-secret-change-me-please-32chars");

export type StaffSession = {
  kind: "staff";
  teamMemberId: string;
  organizationId: string;
  systemRole: string;
};

export type ClientSession = {
  kind: "client";
  contactId: string;
  accountId: string;
};

export type Session = StaffSession | ClientSession;

const SESSION_COOKIE = "synk_session";
const IMPERSONATION_COOKIE = "synk_impersonate_account_id";

async function sign(payload: Session) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

export async function createStaffSession(teamMemberId: string, organizationId: string, systemRole: string) {
  const token = await sign({ kind: "staff", teamMemberId, organizationId, systemRole });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function createClientSession(contactId: string, accountId: string) {
  const token = await sign({ kind: "client", contactId, accountId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(IMPERSONATION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function requireStaffSession(): Promise<StaffSession> {
  const session = await getSession();
  if (!session || session.kind !== "staff") {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireClientSession(): Promise<ClientSession> {
  const session = await getSession();
  if (!session || session.kind !== "client") {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

// --- Impersonation ("view as tenant") -------------------------------------

export async function setImpersonatedAccount(accountId: string) {
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, accountId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function clearImpersonatedAccount() {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
}

export async function getImpersonatedAccountId(): Promise<string | null> {
  const store = await cookies();
  return store.get(IMPERSONATION_COOKIE)?.value ?? null;
}

/**
 * Resolves the "effective" account context for the currently logged-in
 * identity: a client contact is always scoped to their own account; staff
 * are scoped to whichever account they are currently impersonating, if any.
 */
export async function getEffectiveAccountId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.kind === "client") return session.accountId;
  return getImpersonatedAccountId();
}

export async function getCurrentTeamMember() {
  const session = await getSession();
  if (!session || session.kind !== "staff") return null;
  return prisma.teamMember.findUnique({ where: { id: session.teamMemberId } });
}

export async function getCurrentContact() {
  const session = await getSession();
  if (!session || session.kind !== "client") return null;
  return prisma.contact.findUnique({ where: { id: session.contactId }, include: { account: true } });
}
