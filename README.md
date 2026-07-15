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

## Setup rápido (dev, sem Docker/Supabase)

```bash
npm install
cp .env.example .env        # o padrão já aponta para o Postgres local
# edite o .env e cole sua GEMINI_API_KEY (grátis em aistudio.google.com/apikey)
# para as funções de IA (análise, playbook, roteiros)

npm run db:local            # terminal 1 — Postgres embutido (PGlite) na porta 5432

# terminal 2:
npm run db:push             # cria as tabelas
npm run db:seed             # (opcional) dados de exemplo (Top 30 fake)
npm run dev                 # dashboard em http://localhost:3000
```

> Um **único `.env` na raiz** vale para tudo (os scripts carregam via `dotenv-cli`).
> A **IA (Gemini) roda no próprio dashboard** — importe seu CSV/XLSX e clique em **Processar tudo (IA)**.
> O worker (download + transcrição via Whisper) é opcional e roda em Docker/nuvem.

## Deploy

Guia completo em **[`docs/DEPLOY.md`](docs/DEPLOY.md)**: Vercel (web) + Railway (worker) + Supabase + R2 + Gemini.

## Scripts úteis

| Comando | O quê |
|---|---|
| `npm run db:local` | Postgres local (PGlite) para dev |
| `npm run db:push` | Cria/atualiza as tabelas |
| `npm run db:seed` | Dados de exemplo |
| `npm run db:studio` | Prisma Studio |
| `npm run dev` | Dashboard (Next.js) |
| `npm run worker` | Worker do pipeline |
| `npm run typecheck` | Typecheck de todos os pacotes |
| `npm test` | Testes (filtro Top 30) |

## Nota de uso

Ferramenta de uso **interno** para análise do conteúdo dos afiliados da própria loja. Os vídeos baixados não devem ser redistribuídos; respeite os Termos de Serviço do TikTok e os direitos dos criadores.
