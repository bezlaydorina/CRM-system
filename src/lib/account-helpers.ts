import type { Payment } from "@prisma/client";

export function paymentStatusBadge(payments: Payment[]): { label: string; color: "red" | "green" | "amber" | "gray" } {
  const setup = payments.find((p) => p.type === "ONE_TIME");
  const monthly = payments
    .filter((p) => p.type === "MONTHLY")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const deposit = payments.find((p) => p.type === "DEPOSIT");

  if (setup && setup.status !== "PAID") {
    return { label: "SETUP NINCS FIZETVE", color: "red" };
  }
  if (deposit && deposit.status !== "PAID") {
    return { label: "ELŐLEG", color: "amber" };
  }
  if (monthly) {
    if (monthly.status === "PAID") return { label: "FIZETETT", color: "green" };
    if (monthly.status === "EXPIRED" && monthly.dueDate) {
      const days = Math.floor((Date.now() - monthly.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return { label: `NEM FIZETETT · ${days} NAPJA LEJÁRT`, color: "red" };
    }
    return { label: "VÁRAKOZIK", color: "amber" };
  }
  return { label: "FIZETETT", color: "green" };
}

export function daysInStage(enteredAt: Date) {
  return Math.floor((Date.now() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));
}
