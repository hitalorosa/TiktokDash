# Nouè — TikTok Shop UGC Dashboard

Dashboard para analisar os vídeos de **UGC / afiliados** do TikTok Shop da Nouè: seleciona os **Top 30** que mais venderam nos últimos 30 dias, baixa e transcreve cada vídeo, gera uma **análise de IA** (o que replicar / copiar / evitar) e transforma tudo em **roteiros de vídeo** prontos — para pessoas reais gravarem e para replicar com IA.

> 🚧 Em construção. Veja [`docs/PLAN.md`](docs/PLAN.md) para o plano completo.

## Arquitetura (resumo)

- **`apps/web`** — Dashboard Next.js (deploy no **Vercel**).
- **`apps/worker`** — Worker Node/TS com o pipeline pesado: ingestão → seleção Top 30 → download (yt-dlp) → transcrição (whisper.cpp) → análise (Gemini) → roteiros. Deploy no **Railway/Render** (Docker).
- **`packages/db`** — Prisma + Postgres (Supabase/Neon), schema compartilhado.
- **`packages/core`** — Motor de seleção Top 30, adapters de ingestão (CSV / TikTok Shop API), prompts do Gemini.
- **`packages/config`** — Validação de variáveis de ambiente.

## Stack

Next.js · TypeScript · Prisma · Postgres · Cloudflare R2 · Gemini API · Whisper.cpp · yt-dlp · npm workspaces.

## Setup rápido (dev)

```bash
npm install
cp .env.example .env        # preencha as chaves
npm run db:generate
npm run db:push             # cria as tabelas
npm run db:seed             # popula dados de exemplo (Top 30 fake)
npm run dev                 # sobe o dashboard em http://localhost:3000
```

> O worker (download/transcrição) roda em Docker/nuvem, não é necessário localmente para ver o dashboard.

## Nota de uso

Ferramenta de uso **interno** para análise do conteúdo dos afiliados da própria loja. Os vídeos baixados não devem ser redistribuídos; respeite os Termos de Serviço do TikTok e os direitos dos criadores.
