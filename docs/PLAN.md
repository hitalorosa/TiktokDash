# Plano — Dashboard de UGC / TikTok Shop (Nouè)

## Contexto

A Nouè quer entender **por que certos vídeos de criadores (UGC) vendem mais** no TikTok Shop e transformar isso em um playbook replicável. O objetivo é um **dashboard** que, a cada janela de 30 dias:

1. Puxa os vídeos de afiliados/UGC vinculados à loja Nouè.
2. Seleciona os **Top 30** que mais venderam (ranqueados por GMV).
3. Para cada vídeo do Top 30: permite **baixar** o vídeo, gera a **transcrição** e uma **análise de IA** (pontos fortes, o que replicar/copiar, o que evitar).
4. Gera uma **análise geral dos 30 dias** — um playbook do que seguir nos próximos UGCs.
5. Transforma a análise em **roteiros de vídeo** prontos: para **pessoas reais gravarem** e para **replicar com IA**.

Precisa rodar **fora da máquina do usuário** (deploy no **Vercel + GitHub**).

## Decisões travadas

- **Fonte dos dados:** TikTok Shop **Seller/Affiliate Center** + **API oficial** (TikTok Shop Open Platform) como alvo.
- **Natureza:** vídeos de **afiliado orgânico** (sem gasto de anúncio) → **não há ROAS**; seleção por **GMV**.
- **IA:** análise via **Gemini API**; transcrição via **Whisper self-hosted** (grátis).
- **Processamento pesado:** **worker separado** (Railway/Render) com **yt-dlp** + **Whisper**.

## Seleção: Top 30

- Os **Top 30** por GMV (desc) da janela de 30 dias (`topN` configurável).
- Tiers viram **rótulo de qualidade**: Tier 1 = GMV ≥ 10.000 · Tier 2 = GMV ≥ 5.000 · abaixo = "abaixo da meta".
- Campo ROAS modelado e opcional (caso venham a impulsionar vídeos).

## Arquitetura

```
GitHub (monorepo)
   ├──► Vercel  →  apps/web (Next.js)  ── Dashboard + API leves
   │                    │  Prisma
   │                    ▼
   │              Postgres (Supabase/Neon)   +   Cloudflare R2 (vídeos/áudio)
   │                    ▲
   └──► Railway/Render →  apps/worker (Node/TS)  ── cron + fila (DB)
                          ingest → Top 30 → download → transcrição → análise → agregado → roteiros
```

## Modelo de dados (Prisma)

Creator, Video, VideoMetric, Transcript, VideoAnalysis, AggregateReport, **Script** (roteiro human/ai), FilterConfig (topN=30), Job (fila).

## Pipeline (worker)

1. Ingestão (`INGEST_SOURCE=tiktok_api|csv`) → Video + VideoMetric.
2. Seleção Top 30 por GMV.
3. Download (yt-dlp) → R2.
4. Transcrição (whisper.cpp, pt).
5. Análise por vídeo (Gemini).
6. Análise agregada 30d (Gemini).
7. Geração de roteiros (Gemini) → `human` (pessoa grava) + `ai` (replicar com IA).

## Roadmap

- **Fase 0** — Fundação do monorepo.
- **Fase 1** — Ingestão CSV + filtro Top 30 + lista no dash.
- **Fase 2** — Download + transcrição.
- **Fase 3** — Análise por vídeo.
- **Fase 4** — Análise agregada.
- **Fase 5** — Gerador de roteiros.
- **Fase 6** — Automação, auth, adapter TikTok Shop API real.

## Ações do usuário

1. Registrar app no TikTok Shop Partner Center (adapter de API). Começamos por CSV.
2. Exportar 1 relatório do Affiliate Center para validar campos (link/ID do vídeo, GMV por vídeo).
3. Criar contas grátis: Supabase, Cloudflare R2, Railway/Render, Google AI Studio (Gemini).
4. Confirmar moeda (BRL/USD).

## Riscos principais

1. Aprovação da API TikTok demora → começar por CSV (adapter plugável).
2. API pode não expor GMV por vídeo → validar cedo com o export do Affiliate Center.
3. Download yt-dlp pode ser bloqueado em IP de datacenter → proxy/fallback + upload manual.
4. Link do vídeo pode não vir no relatório → aceitar url OU handle+id OU upload manual.
5. Limites do Vercel serverless → todo o pesado no worker.
