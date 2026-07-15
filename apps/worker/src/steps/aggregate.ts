import { prisma } from "@noue/db";
import { buildAggregatePrompt, type AggregateOutput, type AggregateVideoInput } from "@noue/core";
import { generateJson } from "../gemini";
import { enqueue } from "../queue";

/** Gera o playbook agregado dos Top N vídeos analisados na janela mais recente. */
export async function runAggregate() {
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
  if (analyzed.length === 0) throw new Error("Nenhum vídeo analisado ainda");

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
      raw: out as object,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
  });

  // encadeia a geração de roteiros
  await enqueue("scripts", { aggregateReportId: report.id });
}
