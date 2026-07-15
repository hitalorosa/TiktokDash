import { NextResponse } from "next/server";
import { prisma } from "@noue/db";
import { selectTopN } from "@noue/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return await reprocess();
  } catch (e) {
    return NextResponse.json(
      { error: "Banco de dados indisponível: " + (e as Error).message },
      { status: 503 }
    );
  }
}

async function reprocess() {
  const config = await prisma.filterConfig.findUnique({ where: { id: "default" } });
  const topN = config?.topN ?? 30;
  const rankBy = (config?.rankBy ?? "gmv") as "gmv" | "orders" | "roas";
  const tier1Gmv = config?.tier1Gmv ?? 10000;
  const tier2Gmv = config?.tier2Gmv ?? 5000;

  // janela mais recente
  const latest = await prisma.videoMetric.findFirst({ orderBy: { windowEnd: "desc" } });
  if (!latest) {
    return NextResponse.json({ error: "Sem dados para reprocessar. Importe um CSV primeiro." }, { status: 400 });
  }
  const metrics = await prisma.videoMetric.findMany({
    where: { windowEnd: latest.windowEnd },
    include: { video: true },
  });

  // re-ranqueia
  const ranked = selectTopN(
    metrics.map((m) => ({
      metricId: m.id,
      videoId: m.videoId,
      url: m.video.url,
      status: m.video.status,
      mediaKey: m.video.mediaKey,
      gmv: m.gmv,
      orders: m.orders,
      roas: m.roas,
    })),
    { topN: metrics.length, rankBy, tier1Gmv, tier2Gmv }
  );

  await Promise.all(
    ranked.map((r) =>
      prisma.videoMetric.update({
        where: { id: r.metricId },
        data: { rank: r.rank, tier: r.tier },
      })
    )
  );

  return NextResponse.json({
    message: `Top ${topN} reordenado (${ranked.length} vídeos).`,
    reranked: ranked.length,
  });
}
