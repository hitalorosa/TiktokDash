import { prisma, type Prisma } from "@noue/db";
import { buildScriptsPrompt, type AggregateOutput, type ScriptOutput } from "@noue/core";
import { generateJson } from "../gemini";
import { env } from "../env";

/** Gera roteiros (human + ai) a partir de um relatório agregado. */
export async function runScripts(aggregateReportId?: string) {
  const report = aggregateReportId
    ? await prisma.aggregateReport.findUnique({ where: { id: aggregateReportId } })
    : await prisma.aggregateReport.findFirst({ orderBy: { createdAt: "desc" } });
  if (!report) throw new Error("Nenhum relatório agregado encontrado");

  const summary: AggregateOutput = {
    summary: report.summary ?? "",
    winningStructure: report.winningStructure ?? "",
    themes: report.themes,
    recurringHooks: report.recurringHooks,
    avoidList: report.avoidList,
    recommendations: report.recommendations,
  };

  const out = await generateJson<ScriptOutput[]>(
    buildScriptsPrompt(summary, { humanCount: env.scripts.human, aiCount: env.scripts.ai })
  );
  const list = Array.isArray(out) ? out : [];
  if (list.length === 0) throw new Error("Gemini não retornou roteiros");

  // substitui os roteiros anteriores deste relatório
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
}
