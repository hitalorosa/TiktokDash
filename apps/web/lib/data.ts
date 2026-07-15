import { prisma } from "@noue/db";

const DEFAULT_CONFIG = {
  id: "default",
  topN: 30,
  rankBy: "gmv",
  tier1Gmv: 10000,
  tier2Gmv: 5000,
  windowDays: 30,
  currency: "BRL",
  minTier1: 0,
};

export async function getDbOk(): Promise<boolean> {
  try {
    // query normal (evita prepared statement de $queryRaw, que conflita no PGlite local)
    await prisma.filterConfig.findUnique({ where: { id: "default" } });
    return true;
  } catch {
    return false;
  }
}

export async function getConfig() {
  try {
    const c = await prisma.filterConfig.findUnique({ where: { id: "default" } });
    return c ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function getTopVideos(limit = 30) {
  try {
    return await prisma.videoMetric.findMany({
      orderBy: [{ rank: "asc" }, { gmv: "desc" }],
      take: limit,
      include: {
        video: {
          include: {
            creator: true,
            analysis: { select: { id: true } },
            transcript: { select: { id: true } },
          },
        },
      },
    });
  } catch (e) {
    console.error("getTopVideos:", e);
    return [];
  }
}

export type TopVideoRow = Awaited<ReturnType<typeof getTopVideos>>[number];

export async function getVideo(id: string) {
  try {
    return await prisma.video.findUnique({
      where: { id },
      include: {
        creator: true,
        metrics: { orderBy: { windowEnd: "desc" }, take: 1 },
        transcript: true,
        analysis: true,
      },
    });
  } catch (e) {
    console.error("getVideo:", e);
    return null;
  }
}

export async function getLatestReport() {
  try {
    return await prisma.aggregateReport.findFirst({ orderBy: { createdAt: "desc" } });
  } catch {
    return null;
  }
}

export async function getScripts() {
  try {
    return await prisma.script.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export function computeStats(rows: TopVideoRow[]) {
  const totalGmv = rows.reduce((s, r) => s + (r.gmv ?? 0), 0);
  const totalOrders = rows.reduce((s, r) => s + (r.orders ?? 0), 0);
  const tier1 = rows.filter((r) => r.tier === "tier1").length;
  const tier2 = rows.filter((r) => r.tier === "tier2").length;
  const convValues = rows.map((r) => r.convRate).filter((v): v is number => v != null);
  const avgConv = convValues.length
    ? convValues.reduce((s, v) => s + v, 0) / convValues.length
    : null;
  const avgTicket = totalOrders ? totalGmv / totalOrders : null;
  const currency = rows[0]?.currency ?? "BRL";
  return { totalGmv, totalOrders, tier1, tier2, avgConv, avgTicket, count: rows.length, currency };
}
