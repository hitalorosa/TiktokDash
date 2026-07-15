import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "@noue/db";
import { env } from "../env";
import { run } from "../util";
import * as storage from "../storage";
import { enqueue } from "../queue";

interface WhisperSegment {
  offsets?: { from?: number; to?: number };
  text?: string;
}

/** Faz o parse do JSON do whisper.cpp (-oj) em texto completo + segmentos (em segundos). */
function parseWhisperJson(raw: string): { text: string; segments: { start: number; end: number; text: string }[] } {
  const data = JSON.parse(raw) as { transcription?: WhisperSegment[] };
  const list = Array.isArray(data.transcription) ? data.transcription : [];
  const segments = list.map((s) => ({
    start: (s.offsets?.from ?? 0) / 1000,
    end: (s.offsets?.to ?? 0) / 1000,
    text: (s.text ?? "").trim(),
  }));
  const text = segments
    .map((s) => s.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, segments };
}

/** Baixa o áudio do R2 e transcreve com whisper.cpp. */
export async function runTranscribe(videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new Error(`Vídeo ${videoId} não encontrado`);
  if (!video.audioKey) throw new Error(`Vídeo ${videoId} sem áudio (rode o download antes)`);

  await prisma.video.update({ where: { id: videoId }, data: { status: "transcribing" } });

  const dir = await mkdtemp(join(tmpdir(), "noue-tr-"));
  const wav = join(dir, "audio.wav");
  const outPrefix = join(dir, "out");
  try {
    await storage.downloadToFile(video.audioKey, wav);
    await run(env.whisper.bin, [
      "-m", env.whisper.model,
      "-f", wav,
      "-l", env.whisper.lang,
      "-oj",
      "-of", outPrefix,
    ]);
    const raw = await readFile(`${outPrefix}.json`, "utf8");
    const { text, segments } = parseWhisperJson(raw);

    await prisma.transcript.upsert({
      where: { videoId },
      create: { videoId, text, segments, lang: env.whisper.lang, provider: "whisper" },
      update: { text, segments, provider: "whisper" },
    });
    await prisma.video.update({ where: { id: videoId }, data: { status: "transcribed" } });
    await enqueue("analyze", { videoId });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
