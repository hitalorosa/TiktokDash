import { prisma } from "@noue/db";
import { buildPerVideoPrompt, type PerVideoAnalysisOutput } from "@noue/core";
import { generateJson } from "../gemini";
import { enqueue } from "../queue";

/** Analisa um vídeo com o Gemini (transcrição + métricas) e salva a análise estruturada. */
export async function runAnalyze(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      creator: true,
      transcript: true,
      metrics: { orderBy: { windowEnd: "desc" }, take: 1 },
    },
  });
  if (!video) throw new Error(`Vídeo ${videoId} não encontrado`);
  if (!video.transcript) throw new Error(`Vídeo ${videoId} sem transcrição`);

  await prisma.video.update({ where: { id: videoId }, data: { status: "analyzing" } });

  const m = video.metrics[0];
  const prompt = buildPerVideoPrompt({
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
    transcript: video.transcript.text,
  });

  const out = await generateJson<PerVideoAnalysisOutput>(prompt);

  await prisma.videoAnalysis.upsert({
    where: { videoId },
    create: {
      videoId,
      strengths: out.strengths ?? [],
      replicate: out.replicate ?? [],
      copyable: out.copyable ?? [],
      avoid: out.avoid ?? [],
      hookAnalysis: out.hookAnalysis,
      structure: out.structure,
      triggers: out.triggers ?? [],
      summary: out.summary,
      raw: out as object,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
    update: {
      strengths: out.strengths ?? [],
      replicate: out.replicate ?? [],
      copyable: out.copyable ?? [],
      avoid: out.avoid ?? [],
      hookAnalysis: out.hookAnalysis,
      structure: out.structure,
      triggers: out.triggers ?? [],
      summary: out.summary,
      raw: out as object,
    },
  });
  await prisma.video.update({ where: { id: videoId }, data: { status: "analyzed" } });

  await maybeEnqueueAggregate();
}

/** Quando não há mais trabalho por-vídeo pendente, enfileira a análise agregada. */
async function maybeEnqueueAggregate() {
  const pendingPerVideo = await prisma.job.count({
    where: {
      type: { in: ["download", "transcribe", "analyze"] },
      status: { in: ["pending", "processing"] },
    },
  });
  if (pendingPerVideo > 0) return;

  const pendingAgg = await prisma.job.count({
    where: { type: "aggregate", status: { in: ["pending", "processing"] } },
  });
  if (pendingAgg === 0) {
    await enqueue("aggregate", {});
  }
}
