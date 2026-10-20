"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";
import { findValidAuthToken } from "@/lib/auth-tokens";
import {
  createClientSession,
  createStaffSession,
  destroySession,
  requireStaffSession,
  setImpersonatedAccount,
  clearImpersonatedAccount,
} from "@/lib/auth";

export async function staffLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const member = await prisma.teamMember.findUnique({ where: { email } });
  if (!member || !member.passwordHash || !(await verifyPassword(password, member.passwordHash))) {
    redirect("/login?error=1");
  }

  await createStaffSession(member.id, member.organizationId, member.systemRole);
  redirect("/admin");
}

export async function clientLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const contact = await prisma.contact.findFirst({
    where: { email, canLoginPortal: true },
  });
  if (!contact || !contact.passwordHash || !(await verifyPassword(password, contact.passwordHash))) {
    redirect("/portal/login?error=1");
  }

  await createClientSession(contact.id, contact.accountId);
  redirect("/portal");
}

export async function setPasswordViaTokenAction(token: string, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 4 || password !== confirmPassword) {
    redirect(`/jelszo-beallitas/${token}?error=1`);
  }

  const record = await findValidAuthToken(token);
  if (!record) {
    redirect(`/jelszo-beallitas/${token}?error=expired`);
  }

  const hash = await hashPassword(password);
  await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

  if (record.contactId && record.contact) {
    await prisma.contact.update({ where: { id: record.contactId }, data: { passwordHash: hash, canLoginPortal: true } });
    await createClientSession(record.contactId, record.contact.accountId);
    redirect("/portal");
  }

  if (record.teamMemberId && record.teamMember) {
    await prisma.teamMember.update({ where: { id: record.teamMemberId }, data: { passwordHash: hash } });
    await createStaffSession(record.teamMemberId, record.teamMember.organizationId, record.teamMember.systemRole);
    redirect("/admin");
  }

  redirect("/login");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function impersonateAction(formData: FormData) {
  await requireStaffSession();
  const accountId = String(formData.get("accountId") ?? "");
  if (accountId) {
    await setImpersonatedAccount(accountId);
  }
  redirect("/portal");
}

export async function stopImpersonationAction() {
  await clearImpersonatedAccount();
  revalidatePath("/admin");
  redirect("/admin");
}
