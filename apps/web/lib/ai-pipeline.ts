import "server-only";
import { prisma, type Prisma } from "@noue/db";
import {
  buildPerVideoPrompt,
  buildAggregatePrompt,
  buildScriptsPrompt,
  type PerVideoAnalysisOutput,
  type AggregateOutput,
  type AggregateVideoInput,
  type ScriptOutput,
} from "@noue/core";
import { generateJson, GEMINI_MODEL } from "./gemini";

/** Analisa um vídeo com o Gemini (transcrição quando houver, senão legenda + métricas). */
export async function analyzeVideo(videoId: string): Promise<void> {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      creator: true,
      transcript: true,
      metrics: { orderBy: { windowEnd: "desc" }, take: 1 },
    },
  });
  if (!video) throw new Error("Vídeo não encontrado");

  const m = video.metrics[0];
  const transcript =
    video.transcript?.text ||
    "(transcrição indisponível — analise pela legenda e pelas métricas acima)";

  await prisma.video.update({ where: { id: videoId }, data: { status: "analyzing" } });

  const out = await generateJson<PerVideoAnalysisOutput>(
    buildPerVideoPrompt({
      caption: video.caption,
      creatorHandle: video.creator?.handle,
      metrics: {
        gmv: m?.gmv,
        orders: m?.orders,
        views: m?.views,
        convRate: m?.convRate,
        tier: m?.tier,
        currency: m?.currency,
      },
      transcript,
    })
  );

  const data = {
    strengths: out.strengths ?? [],
    replicate: out.replicate ?? [],
    copyable: out.copyable ?? [],
    avoid: out.avoid ?? [],
    hookAnalysis: out.hookAnalysis,
    structure: out.structure,
    triggers: out.triggers ?? [],
    summary: out.summary,
    raw: out as unknown as Prisma.InputJsonValue,
    model: GEMINI_MODEL,
  };
  await prisma.videoAnalysis.upsert({
    where: { videoId },
    create: { videoId, ...data },
    update: data,
  });
  await prisma.video.update({ where: { id: videoId }, data: { status: "analyzed" } });
}

/** Vídeos do Top N ainda sem análise (janela mais recente). */
export async function pendingAnalysis(topN: number) {
  const latest = await prisma.videoMetric.findFirst({ orderBy: { windowEnd: "desc" } });
  if (!latest) return [];
  const metrics = await prisma.videoMetric.findMany({
    where: { windowEnd: latest.windowEnd, rank: { lte: topN } },
    orderBy: { rank: "asc" },
    include: { video: { include: { analysis: { select: { id: true } } } } },
  });
  return metrics.filter((m) => !m.video.analysis).map((m) => m.videoId);
}

/** Gera o playbook agregado a partir dos vídeos analisados do Top N. */
export async function runAggregate(): Promise<string> {
  const config = await prisma.filterConfig.findUnique({ where: { id: "default" } });
  const topN = config?.topN ?? 30;
  const windowDays = config?.windowDays ?? 30;

  const latest = await prisma.videoMetric.findFirst({ orderBy: { windowEnd: "desc" } });
  if (!latest) throw new Error("Sem métricas para agregar");

  const metrics = await prisma.videoMetric.findMany({
    where: { windowEnd: latest.windowEnd, rank: { lte: topN } },
    orderBy: { rank: "asc" },
    include: { video: { include: { analysis: true, transcript: true } } },
  });
  const analyzed = metrics.filter((m) => m.video.analysis);
  if (analyzed.length === 0) throw new Error("Nenhum vídeo analisado ainda — analise antes de gerar o playbook.");

  const inputs: AggregateVideoInput[] = analyzed.map((m) => ({
    rank: m.rank ?? 0,
    caption: m.video.caption,
    gmv: m.gmv,
    tier: m.tier,
    transcriptExcerpt: m.video.transcript?.text?.slice(0, 400),
    strengths: m.video.analysis?.strengths ?? [],
  }));

  const out = await generateJson<AggregateOutput>(buildAggregatePrompt(inputs, windowDays));
  const report = await prisma.aggregateReport.create({
    data: {
      windowStart: latest.windowStart,
      windowEnd: latest.windowEnd,
      videoCount: analyzed.length,
      summary: out.summary,
      winningStructure: out.winningStructure,
      themes: out.themes ?? [],
      recurringHooks: out.recurringHooks ?? [],
      avoidList: out.avoidList ?? [],
      recommendations: out.recommendations ?? [],
      raw: out as unknown as Prisma.InputJsonValue,
      model: GEMINI_MODEL,
    },
  });
  return report.id;
}

/** Gera roteiros (human + ai) a partir do relatório mais recente (ou informado). */
export async function runScripts(aggregateReportId?: string): Promise<number> {
  const report = aggregateReportId
    ? await prisma.aggregateReport.findUnique({ where: { id: aggregateReportId } })
    : await prisma.aggregateReport.findFirst({ orderBy: { createdAt: "desc" } });
  if (!report) throw new Error("Nenhum playbook encontrado — gere a análise agregada primeiro.");

  const summary: AggregateOutput = {
    summary: report.summary ?? "",
    winningStructure: report.winningStructure ?? "",
    themes: report.themes,
    recurringHooks: report.recurringHooks,
    avoidList: report.avoidList,
    recommendations: report.recommendations,
  };

  const out = await generateJson<ScriptOutput[]>(buildScriptsPrompt(summary, { humanCount: 2, aiCount: 2 }));
  const list = Array.isArray(out) ? out : [];
  if (list.length === 0) throw new Error("O Gemini não retornou roteiros");

  await prisma.script.deleteMany({ where: { aggregateReportId: report.id } });
  await prisma.script.createMany({
    data: list.map((s) => ({
      aggregateReportId: report.id,
      title: s.title ?? "Roteiro",
      mode: s.mode === "ai" ? "ai" : "human",
      angle: s.angle,
      hook: s.hook,
      body: s.body,
      cta: s.cta,
      shotList: (s.shotList ?? []) as unknown as Prisma.InputJsonValue,
      aiPrompt: s.aiPrompt,
      durationSec: s.durationSec,
      status: "draft",
    })),
  });
  return list.length;
}
