# Worker do pipeline (download + transcrição + análise).
# Build context = RAIZ do repositório (monorepo). No Railway/Render:
#   Dockerfile path: apps/worker/Dockerfile  |  context: raiz do repo.

FROM node:22-bookworm-slim

# ── Dependências de sistema ──
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg curl ca-certificates git build-essential cmake python3 xz-utils \
    && rm -rf /var/lib/apt/lists/*

# ── yt-dlp (binário estático) ──
RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

# ── whisper.cpp (build) + modelo small ──
RUN git clone --depth 1 https://github.com/ggerganov/whisper.cpp /opt/whisper \
    && cmake -B /opt/whisper/build -S /opt/whisper -DCMAKE_BUILD_TYPE=Release \
    && cmake --build /opt/whisper/build --config Release -j \
    && cp /opt/whisper/build/bin/whisper-cli /usr/local/bin/whisper-cli \
    && rm -rf /opt/whisper/build/CMakeFiles
RUN mkdir -p /models && curl -fsSL \
      https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin \
      -o /models/ggml-small.bin

ENV WHISPER_BIN=/usr/local/bin/whisper-cli \
    WHISPER_MODEL_PATH=/models/ggml-small.bin \
    YTDLP_BIN=/usr/local/bin/yt-dlp \
    FFMPEG_BIN=ffmpeg

WORKDIR /app

# ── Instala dependências (monorepo, com devDeps p/ o Prisma CLI) e gera o client ──
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN npm install --include=dev --no-audit --no-fund
RUN npm run db:generate

# runtime em produção (após o build para não pular devDeps do Prisma acima)
ENV NODE_ENV=production
CMD ["npm", "run", "start", "-w", "worker"]
