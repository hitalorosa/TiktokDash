export const env = {
  geminiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
  r2: {
    endpoint: process.env.R2_ENDPOINT || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucket: process.env.R2_BUCKET || "noue-ugc",
  },
  whisper: {
    bin: process.env.WHISPER_BIN || "whisper-cli",
    model: process.env.WHISPER_MODEL_PATH || "/models/ggml-small.bin",
    lang: process.env.WHISPER_LANG || "pt",
  },
  ytdlp: {
    bin: process.env.YTDLP_BIN || "yt-dlp",
    proxy: process.env.DOWNLOAD_PROXY_URL || "",
  },
  ffmpegBin: process.env.FFMPEG_BIN || "ffmpeg",
  pollMs: Number(process.env.WORKER_POLL_MS || 5000),
  scripts: {
    human: Number(process.env.SCRIPTS_HUMAN_COUNT || 2),
    ai: Number(process.env.SCRIPTS_AI_COUNT || 2),
  },
};
