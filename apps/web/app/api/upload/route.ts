import { NextResponse } from "next/server";
import { prisma } from "@noue/db";
import { parseAffiliateCsv, selectTopN } from "@noue/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Exports reais do TikTok podem ter milhares de linhas; só persistimos o topo
// por GMV (cobre o Top 30 com folga) para caber no tempo do serverless.
const IMPORT_CAP = 150;
const CHUNK = 10;

function floorToDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function inChunks<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
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
    return NextResponse.json({ error: "Conteúdo do arquivo ausente" }, { status: 400 });
  }

  const { rows, unmappedHeaders, skipped } = parseAffiliateCsv(content);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma linha com GMV reconhecida no arquivo.", unmappedHeaders },
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

    // Ranqueia e mantém só o topo (com rank/tier corretos entre os selecionados).
    const ranked = selectTopN(
      rows.map((r, i) => ({ ...r, _idx: i })),
      { topN: Math.min(rows.length, IMPORT_CAP), rankBy, tier1Gmv, tier2Gmv }
    );

    // Upsert de criadores (dedup) → mapa handle→id.
    const handles = [...new Set(ranked.map((r) => r.creatorHandle).filter(Boolean) as string[])];
    const creatorMap = new Map<string, string>();
    for (const h of handles) {
      const c = await prisma.creator.upsert({
        where: { handle: h },
        create: { handle: h },
        update: {},
      });
      creatorMap.set(h, c.id);
    }

    let imported = 0;
    await inChunks(ranked, CHUNK, async (r) => {
      const creatorId = r.creatorHandle ? creatorMap.get(r.creatorHandle) : undefined;
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

      const data = {
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
      };
      await prisma.videoMetric.upsert({
        where: {
          videoId_windowStart_windowEnd: { videoId: video.id, windowStart, windowEnd },
        },
        create: { videoId: video.id, windowStart, windowEnd, ...data },
        update: data,
      });
      imported++;
    });

    return NextResponse.json({
      message: `Importados ${imported} vídeos (topo por GMV de ${rows.length} lidos).`,
      imported,
      totalRows: rows.length,
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
