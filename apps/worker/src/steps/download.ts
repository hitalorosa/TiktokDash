import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "@noue/db";
import { env } from "../env";
import { run } from "../util";
import * as storage from "../storage";
import { enqueue } from "../queue";

/** Baixa o vídeo (yt-dlp), extrai o áudio (ffmpeg) e sobe ambos para o R2. */
export async function runDownload(videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new Error(`Vídeo ${videoId} não encontrado`);
  if (!video.url) throw new Error(`Vídeo ${videoId} sem URL para download`);

  await prisma.video.update({ where: { id: videoId }, data: { status: "downloading", error: null } });

  const dir = await mkdtemp(join(tmpdir(), "noue-dl-"));
  const mp4 = join(dir, "video.mp4");
  const wav = join(dir, "audio.wav");
  try {
    const ytArgs = ["-f", "mp4/bestvideo+bestaudio/best", "--no-playlist", "--no-warnings", "-o", mp4];
    if (env.ytdlp.proxy) ytArgs.push("--proxy", env.ytdlp.proxy);
    ytArgs.push(video.url);
    await run(env.ytdlp.bin, ytArgs);

    // extrai áudio 16kHz mono (ideal para whisper)
    await run(env.ffmpegBin, ["-y", "-i", mp4, "-vn", "-ar", "16000", "-ac", "1", wav]);

    const mediaKey = `videos/${videoId}.mp4`;
    const audioKey = `audio/${videoId}.wav`;
    if (storage.isConfigured()) {
      await storage.uploadFile(mediaKey, mp4, "video/mp4");
      await storage.uploadFile(audioKey, wav, "audio/wav");
    } else {
      console.warn("[download] R2 não configurado — mídia não persistida.");
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { mediaKey, audioKey, status: "downloaded" },
    });
    await enqueue("transcribe", { videoId });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
