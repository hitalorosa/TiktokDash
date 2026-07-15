import { NextResponse } from "next/server";
import { prisma } from "@noue/db";
import { parseAffiliateCsv, selectTopN } from "@noue/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function floorToDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const content = body.content;
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Conteúdo do CSV ausente" }, { status: 400 });
  }

  const { rows, unmappedHeaders, skipped } = parseAffiliateCsv(content);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma linha com GMV reconhecida no CSV.", unmappedHeaders },
      { status: 400 }
    );
  }

  try {
  const config = await prisma.filterConfig.findUnique({ where: { id: "default" } });
  const windowDays = config?.windowDays ?? 30;
  const rankBy = (config?.rankBy ?? "gmv") as "gmv" | "orders" | "roas";
  const tier1Gmv = config?.tier1Gmv ?? 10000;
  const tier2Gmv = config?.tier2Gmv ?? 5000;
  const currency = config?.currency ?? "BRL";

  const windowEnd = floorToDay(new Date());
  const windowStart = new Date(windowEnd.getTime() - windowDays * 86400000);

  // Ranqueia TODAS as linhas (topN = tamanho) para gravar rank+tier em cada uma.
  const ranked = selectTopN(
    rows.map((r, i) => ({ ...r, _idx: i })),
    { topN: rows.length, rankBy, tier1Gmv, tier2Gmv }
  );

  let imported = 0;
  for (const r of ranked) {
    // criador
    let creatorId: string | undefined;
    if (r.creatorHandle) {
      const creator = await prisma.creator.upsert({
        where: { handle: r.creatorHandle },
        create: { handle: r.creatorHandle, displayName: r.creatorName },
        update: { displayName: r.creatorName ?? undefined },
      });
      creatorId = creator.id;
    }

    // vídeo (match por tiktokVideoId quando existir)
    let video;
    if (r.tiktokVideoId) {
      video = await prisma.video.upsert({
        where: { tiktokVideoId: r.tiktokVideoId },
        create: {
          tiktokVideoId: r.tiktokVideoId,
          url: r.url,
          creatorId,
          caption: r.caption,
          postedAt: r.postedAt,
          productIds: r.productIds ?? [],
        },
        update: {
          url: r.url ?? undefined,
          creatorId: creatorId ?? undefined,
          caption: r.caption ?? undefined,
          postedAt: r.postedAt ?? undefined,
        },
      });
    } else {
      video = await prisma.video.create({
        data: {
          url: r.url,
          creatorId,
          caption: r.caption,
          postedAt: r.postedAt,
          productIds: r.productIds ?? [],
        },
      });
    }

    // métrica (upsert por janela)
    await prisma.videoMetric.upsert({
      where: {
        videoId_windowStart_windowEnd: {
          videoId: video.id,
          windowStart,
          windowEnd,
        },
      },
      create: {
        videoId: video.id,
        windowStart,
        windowEnd,
        gmv: r.gmv,
        orders: r.orders ?? 0,
        unitsSold: r.unitsSold ?? 0,
        productClicks: r.productClicks ?? 0,
        views: r.views ?? 0,
        convRate: r.convRate ?? null,
        commission: r.commission ?? null,
        roas: r.roas ?? null,
        rank: r.rank,
        tier: r.tier,
        currency,
      },
      update: {
        gmv: r.gmv,
        orders: r.orders ?? 0,
        unitsSold: r.unitsSold ?? 0,
        productClicks: r.productClicks ?? 0,
        views: r.views ?? 0,
        convRate: r.convRate ?? null,
        commission: r.commission ?? null,
        roas: r.roas ?? null,
        rank: r.rank,
        tier: r.tier,
        currency,
      },
    });
    imported++;
  }

  return NextResponse.json({
    message: `Importados ${imported} vídeos.`,
    imported,
    skipped,
    unmappedHeaders,
  });
  } catch (e) {
    return NextResponse.json(
      { error: "Banco de dados indisponível: " + (e as Error).message },
      { status: 503 }
    );
  }
}
