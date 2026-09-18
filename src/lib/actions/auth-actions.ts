"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
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
  if (!member || !(await verifyPassword(password, member.passwordHash))) {
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
