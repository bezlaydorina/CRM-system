import { prisma } from "./prisma";

const DEFAULT_STAGES = [
  { name: "Új lead", color: "#6366f1" },
  { name: "Megkeresve", color: "#3b82f6" },
  { name: "Minősített", color: "#0ea5e9" },
  { name: "Ajánlat elküldve", color: "#f59e0b" },
  { name: "Megnyert", color: "#22c55e" },
  { name: "Elveszett", color: "#ef4444" },
];

/**
 * Every Account (and the agency's own internal-sales "account") gets a
 * default Pipeline with the standard 6 stages the very moment it is
 * created, mirroring the always-present mini-CRM described in the spec.
 */
export async function createDefaultCrmSetup(accountId: string, pipelineName = "Új ügyfelek") {
  const pipeline = await prisma.pipeline.create({
    data: {
      accountId,
      name: pipelineName,
      isDefault: true,
      stages: {
        create: DEFAULT_STAGES.map((s, i) => ({ name: s.name, color: s.color, order: i })),
      },
    },
    include: { stages: true },
  });
  return pipeline;
}
