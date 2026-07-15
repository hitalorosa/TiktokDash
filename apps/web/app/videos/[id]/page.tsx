import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideo } from "@/lib/data";
import { money, num, pct, dateBR } from "@/lib/format";
import { TierBadge, StatusBadge, ListBlock, Chip, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const m = video.metrics[0];
  const currency = m?.currency ?? "BRL";
  const a = video.analysis;
  const hasMedia = Boolean(video.mediaKey);

  return (
    <>
      <Link href="/videos" className="text-sm text-[var(--color-brand-2)] hover:underline">
        ← Voltar ao Top 30
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">@{video.creator?.handle ?? "criador"}</h1>
            {m && <TierBadge tier={m.tier} />}
            {m?.rank && <span className="text-sm muted">#{m.rank}</span>}
            <StatusBadge status={video.status} />
          </div>
          <p className="mt-1 max-w-xl text-sm muted">{video.caption ?? "(sem legenda)"}</p>
          <p className="mt-1 text-xs muted">Publicado em {dateBR(video.postedAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href={`/api/videos/${video.id}/download`}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              hasMedia
                ? "gradient-brand text-white hover:opacity-90"
                : "cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-60"
            }`}
          >
            ⬇️ Baixar vídeo
          </a>
          {video.url && (
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--color-brand-2)] hover:underline"
            >
              Abrir no TikTok ↗
            </a>
          )}
          {!hasMedia && <span className="text-xs muted">Vídeo ainda não baixado pelo worker</span>}
        </div>
      </div>

      {/* métricas */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="GMV" value={money(m?.gmv, currency)} accent />
        <Metric label="Pedidos" value={num(m?.orders)} />
        <Metric label="Conversão" value={pct(m?.convRate)} />
        <Metric label="Views" value={num(m?.views)} />
        <Metric label="Comissão" value={money(m?.commission, currency)} />
      </div>

      {/* análise */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">🔍 Análise de IA</h2>
        {a ? (
          <div className="space-y-4">
            {a.summary && (
              <Card>
                <p className="text-sm leading-relaxed">{a.summary}</p>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <ListBlock title="Pontos fortes" items={a.strengths} icon="💪" />
              <ListBlock title="Replicar" items={a.replicate} icon="🔁" />
              <ListBlock title="Copiar (frases/estruturas)" items={a.copyable} icon="📋" />
              <ListBlock title="Evitar" items={a.avoid} icon="⛔" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {a.hookAnalysis && (
                <div className="card-2 p-4">
                  <div className="mb-1 text-sm font-semibold">🎣 Gancho (0-3s)</div>
                  <p className="text-sm">{a.hookAnalysis}</p>
                </div>
              )}
              {a.structure && (
                <div className="card-2 p-4">
                  <div className="mb-1 text-sm font-semibold">🧩 Estrutura</div>
                  <p className="text-sm">{a.structure}</p>
                </div>
              )}
            </div>
            {a.triggers.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold">🧠 Gatilhos</div>
                <div className="flex flex-wrap gap-2">
                  {a.triggers.map((t, i) => (
                    <Chip key={i}>{t}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <p className="text-sm muted">
              Análise ainda não gerada. O worker analisa este vídeo após baixar e transcrever.
            </p>
          </Card>
        )}
      </div>

      {/* transcrição */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">📝 Transcrição</h2>
        <Card>
          {video.transcript ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{video.transcript.text}</p>
          ) : (
            <p className="text-sm muted">Transcrição ainda não disponível.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card-2 p-3">
      <div className="text-xs muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-[var(--color-brand)]" : ""}`}>
        {value}
      </div>
    </div>
  );
}
