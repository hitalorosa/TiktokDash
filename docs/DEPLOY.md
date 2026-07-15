# Deploy — Nouè TikTok Dash

Arquitetura de produção:

- **Dashboard (`apps/web`)** → **Vercel**
- **Worker (`apps/worker`)** → **Railway** (ou Render) via Docker
- **Banco** → **Supabase** (Postgres) — ou Neon
- **Mídia** → **Cloudflare R2**
- **IA** → **Gemini** (Google AI Studio)
- **Transcrição** → **whisper.cpp** (embutido na imagem do worker, grátis)

Ordem recomendada: **Banco → Storage → Gemini → Web → Worker**.

---

## 0. Contas necessárias (todas com free tier)

| Serviço | Para quê | Link |
|---|---|---|
| Supabase | Postgres | supabase.com |
| Cloudflare R2 | Vídeos/áudio | dash.cloudflare.com → R2 |
| Google AI Studio | Chave Gemini | aistudio.google.com/apikey |
| Vercel | Dashboard | vercel.com |
| Railway | Worker | railway.app |

---

## 1. Banco (Supabase)

1. Crie um projeto no Supabase e defina uma senha do banco.
2. Em **Project Settings → Database → Connection string**, pegue duas URLs:
   - **Pooled** (porta 6543, `pgbouncer`) → `DATABASE_URL` (adicione `?pgbouncer=true&connection_limit=1`)
   - **Direct** (porta 5432) → `DIRECT_URL`
3. Localmente, com essas URLs no `.env`, crie as tabelas:
   ```bash
   npm run db:push
   # (opcional) dados de exemplo:
   npm run db:seed
   ```

> O Prisma Client é gerado automaticamente: o build do `apps/web` roda `prisma generate` antes do `next build`, e o `postinstall` do `@noue/db` cobre o worker/qualquer `npm install`.

---

## 2. Storage (Cloudflare R2)

1. Crie um **bucket** (ex.: `noue-ugc`).
2. Crie um **API Token R2** (Access Key ID + Secret).
3. Anote o **endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
4. (Opcional) Exponha um domínio público do bucket para `R2_PUBLIC_BASE_URL` — habilita o botão "Baixar vídeo" direto. Sem ele, o download responde 501 (implemente URL assinada se preferir manter privado).

---

## 3. Gemini

Gere a chave em **aistudio.google.com/apikey** → `GEMINI_API_KEY`. Modelo padrão: `gemini-flash-lite-latest`.

---

## 4. Deploy do Dashboard (Vercel)

1. **Import Project** a partir do GitHub (`hitalorosa/TiktokDash`).
2. **Root Directory:** `apps/web` (o Vercel detecta o npm workspace e instala a partir da raiz).
3. **Framework:** Next.js (autodetectado). Build/Install: padrão.
4. **Environment Variables** — o dashboard precisa do banco e do Gemini (a IA roda no próprio dashboard):
   - `DATABASE_URL` — Supabase pooler (obrigatória para exibir dados reais).
   - `GEMINI_API_KEY` — obrigatória para análise/playbook/roteiros (grátis no AI Studio). `GEMINI_MODEL` opcional (`gemini-flash-lite-latest`).
   - `DIRECT_URL` — só se for rodar migrations pelo Vercel (não é usada no runtime das queries).
   - `INGEST_SOURCE=csv` — opcional (apenas muda um rótulo na tela de config).
   - `R2_PUBLIC_BASE_URL` — opcional (habilita "Baixar vídeo" quando o worker já baixou).

   > As chaves do **R2** são só do **worker** (download/transcrição) — não precisa no Vercel.
   > Sem `DATABASE_URL`/`GEMINI_API_KEY`, o deploy sobe e mostra estados vazios/erro claro. Dá para
   > definir depois: as páginas são dinâmicas, então basta salvar a env e recarregar (sem redeploy).
5. **Deploy.** Cada push na `main` redeploya.

> Se o Prisma reclamar de engine no runtime, adicione em `schema.prisma`:
> `binaryTargets = ["native", "rhel-openssl-3.0.x"]` e redeploy.

---

## 5. Deploy do Worker (Railway)

1. **New Project → Deploy from GitHub repo** → selecione o repo.
2. Em **Settings** do serviço:
   - **Root Directory:** `/` (raiz — o Dockerfile precisa do monorepo).
   - **Dockerfile Path:** `apps/worker/Dockerfile`.
   - (o build usa a raiz como contexto; o `.dockerignore` exclui `apps/web`.)
3. **Variables:**
   - `DATABASE_URL`, `DIRECT_URL` (mesmas do Supabase)
   - `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-flash-lite-latest`
   - `R2_*` (endpoint, keys, bucket)
   - `INGEST_SOURCE=csv`
   - (opcional) `DOWNLOAD_PROXY_URL` — proxy residencial se o yt-dlp for bloqueado
   - (opcional) `WHISPER_MODEL_PATH=/models/ggml-small.bin` (já é padrão na imagem)
4. O worker **não expõe porta HTTP** — é um processo de fila. No Railway isso é aceito (não configure Health Check HTTP).
5. Deploy. Logs devem mostrar `[worker] iniciado …`.

> **Alternativa (Render):** crie um **Background Worker** com runtime **Docker**, apontando o Dockerfile para `apps/worker/Dockerfile`.

---

## 6. Variáveis de ambiente — referência

| Variável | Web | Worker | Observação |
|---|:--:|:--:|---|
| `DATABASE_URL` | ✅ | ✅ | Supabase pooled (`pgbouncer=true`) |
| `DIRECT_URL` | migrations | ✅ | Supabase direct — não é usada no runtime do web |
| `GEMINI_API_KEY` | ✅ | ✅ | Análise/playbook/roteiros (dashboard **e** worker) |
| `GEMINI_MODEL` | opcional | ✅ | `gemini-flash-lite-latest` |
| `R2_ACCOUNT_ID` / `R2_ENDPOINT` | | ✅ | Storage (worker) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | | ✅ | Storage (worker) |
| `R2_BUCKET` | | ✅ | ex. `noue-ugc` |
| `R2_PUBLIC_BASE_URL` | opcional | | habilita download no dashboard |
| `INGEST_SOURCE` | opcional | ✅ | `csv` (por enquanto) |
| `DOWNLOAD_PROXY_URL` | | ✅ | opcional |

---

## 7. Fluxo de uso pós-deploy

1. Exporte o relatório de conteúdo/afiliados do **Affiliate Center** (últimos 30 dias).
2. No dashboard → **Configurações → Importar CSV**.
3. Clique **Reprocessar 30 dias** — reordena o Top 30 e enfileira o processamento.
4. O **worker** baixa (yt-dlp), transcreve (whisper) e analisa (Gemini) cada vídeo; ao terminar, gera o **playbook agregado** e os **roteiros**.
5. Veja tudo em **Visão geral**, **Top 30**, **Roteiros**.

---

## 8. TikTok Shop API (fase futura)

Quando o app for aprovado no **TikTok Shop Partner Center**:
1. Preencha `TIKTOK_APP_KEY/SECRET/SHOP_CIPHER/ACCESS_TOKEN` no worker.
2. Mude `INGEST_SOURCE=tiktok_api`.
3. Implemente `fetchWindow` em [`packages/core/src/ingest/tiktok.ts`](../packages/core/src/ingest/tiktok.ts) (o esqueleto/adapter já existe).

---

## Rodar 100% local (sem Supabase/Docker)

```bash
npm install
cp .env.example .env          # padrão já aponta pro Postgres local
npm run db:local              # terminal 1 — Postgres embutido (PGlite) na 5432
npm run db:push && npm run db:seed   # terminal 2
npm run dev                   # http://localhost:3000
```
O worker local precisa de `yt-dlp`, `ffmpeg` e `whisper-cli` no PATH (ou rode via Docker).
