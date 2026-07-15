import { prisma, type JobType } from "@noue/db";
import { env } from "./env";
import { sleep } from "./util";
import { claimNext, complete, fail } from "./queue";
import { runDownload } from "./steps/download";
import { runTranscribe } from "./steps/transcribe";
import { runAnalyze } from "./steps/analyze";
import { runAggregate } from "./steps/aggregate";
import { runScripts } from "./steps/scripts";

interface Payload {
  videoId?: string;
  aggregateReportId?: string;
}

function req(v: string | undefined, name: string): string {
  if (!v) throw new Error(`payload.${name} ausente`);
  return v;
}

async function handle(type: JobType, payload: Payload): Promise<void> {
  switch (type) {
    case "download":
      return runDownload(req(payload.videoId, "videoId"));
    case "transcribe":
      return runTranscribe(req(payload.videoId, "videoId"));
    case "analyze":
      return runAnalyze(req(payload.videoId, "videoId"));
    case "aggregate":
      return runAggregate();
    case "scripts":
      return runScripts(payload.aggregateReportId);
    case "ingest":
      throw new Error("Ingestão via API ainda não implementada — use o import de CSV no dashboard.");
    case "select":
      return; // reservado
    default:
      throw new Error(`Tipo de job desconhecido: ${type}`);
  }
}

let stopping = false;

async function loop() {
  console.log(
    `[worker] iniciado · modelo=${env.geminiModel} · poll=${env.pollMs}ms · whisper=${env.whisper.model}`
  );
  while (!stopping) {
    let job;
    try {
      job = await claimNext();
    } catch (e) {
      console.error("[worker] erro ao reivindicar job:", (e as Error).message);
      await sleep(env.pollMs);
      continue;
    }
    if (!job) {
      await sleep(env.pollMs);
      continue;
    }

    console.log(`[worker] ▶ job ${job.id} (${job.type}) tentativa ${job.attempts}`);
    try {
      await handle(job.type, (job.payload ?? {}) as Payload);
      await complete(job.id);
      console.log(`[worker] ✓ job ${job.id} (${job.type}) concluído`);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[worker] ✗ job ${job.id} (${job.type}) falhou: ${msg}`);
      await fail(job.id, job.attempts, job.maxAttempts, msg);
    }
  }
}

async function shutdown() {
  stopping = true;
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

loop().catch((e) => {
  console.error("[worker] erro fatal:", e);
  process.exit(1);
});
