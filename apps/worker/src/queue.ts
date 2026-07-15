import { prisma, type JobType, type Prisma } from "@noue/db";

/**
 * Reivindica o próximo job pendente. Para um único worker, a transação basta.
 * Para múltiplos workers, trocar por SELECT ... FOR UPDATE SKIP LOCKED.
 */
export async function claimNext() {
  return prisma.$transaction(async (tx) => {
    const next = await tx.job.findFirst({
      where: { status: "pending", runAt: { lte: new Date() } },
      orderBy: [{ runAt: "asc" }, { createdAt: "asc" }],
    });
    if (!next) return null;
    return tx.job.update({
      where: { id: next.id },
      data: { status: "processing", claimedAt: new Date(), attempts: { increment: 1 } },
    });
  });
}

export async function complete(id: string) {
  await prisma.job.update({ where: { id }, data: { status: "done", error: null } });
}

export async function fail(id: string, attempts: number, maxAttempts: number, error: string) {
  const exhausted = attempts >= maxAttempts;
  await prisma.job.update({
    where: { id },
    data: { status: exhausted ? "failed" : "pending", error, claimedAt: null },
  });
}

export async function enqueue(
  type: JobType,
  payload: Record<string, unknown> = {},
  runAt?: Date
) {
  await prisma.job.create({
    data: { type, payload: payload as Prisma.InputJsonValue, runAt: runAt ?? new Date() },
  });
}
