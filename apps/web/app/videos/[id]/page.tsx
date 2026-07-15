import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideo } from "@/lib/data";
import { money, num, pct } from "@/lib/format";
import { TierPill, splitSteps } from "@/components/ui";

export const dynamic = "force-dynamic";

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const AI_BLOCKS = [
  { key: "strengths", title: "Pontos fortes", color: "#1BAF7A" },
  { key: "replicate", title: "Replicar", color: "#2A78D6" },
  { key: "copyable", title: "Copiar (roteiro)", color: "#EDA100" },
  { key: "avoid", title: "Evitar", color: "var(--crit)" },
] as const;

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const m = video.metrics[0];
  const cur = m?.currency ?? "BRL";
  const a = video.analysis;
  const views = m?.convRate && m?.orders ? Math.round(m.orders / m.convRate) : m?.views ?? 0;
  const ticket = m?.orders ? (m.gmv ?? 0) / m.orders : 0;
  const segments = (video.transcript?.segments as { start?: number; text?: string }[] | null) ?? null;

  const metrics = [
    { k: "GMV", v: money(m?.gmv, cur) },
    { k: "Pedidos", v: num(m?.orders) },
    { k: "Conversão", v: pct(m?.convRate) },
    { k: "Views", v: num(views) },
    { k: "Ticket médio", v: money(ticket, cur) },
  ];

  return (
    <>
      <Link
        href="/videos"
        className="sec"
        style={{ fontSize: 13, fontWeight: 600, display: "inline-flex", gap: 6, marginBottom: 18 }}
      >
        ← Top 30
      </Link>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div
            style={{
              width: 74,
              height: 104,
              borderRadius: 12,
              flex: "none",
              background:
                "repeating-linear-gradient(135deg,var(--card2),var(--card2) 7px,var(--border) 7px,var(--border) 8px)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 8,
            }}
          >
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 9, color: "var(--muted)" }}>
              vídeo
            </span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span className="rank" style={{ width: 26, height: 26, fontSize: 11 }}>
                {m?.rank ?? "—"}
              </span>
              <TierPill tier={m?.tier} />
            </div>
            <h1 className="display" style={{ fontSize: 28, lineHeight: 1.1, margin: "0 0 4px" }}>
              @{video.creator?.handle ?? "criador"}
            </h1>
            <div className="sec" style={{ fontSize: 14, maxWidth: "52ch" }}>
              {video.caption ?? "(sem legenda)"}
            </div>
          </div>
        </div>
        <a
          href={`/api/videos/${video.id}/download`}
          className={`btn ${video.mediaKey ? "btn-primary" : "btn-ghost"}`}
        >
          Baixar vídeo
        </a>
      </div>

      <div className="metrics" style={{ marginBottom: 20 }}>
        {metrics.map((mm) => (
          <div key={mm.k} className="metric">
            <div className="metric-k">{mm.k}</div>
            <div className="metric-v">{mm.v}</div>
          </div>
        ))}
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <div className="card" style={{ padding: "24px 26px" }}>
            <h2 className="display" style={{ fontSize: 20, margin: "0 0 18px" }}>Análise de IA</h2>
            {a ? (
              <div className="ai-grid">
                {AI_BLOCKS.map((b) => {
                  const items = (a[b.key] as string[]) ?? [];
                  return (
                    <div key={b.key} className="card2" style={{ padding: "15px 16px" }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: b.color,
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span className="ai-sq" style={{ background: b.color }} />
                        {b.title}
                      </div>
                      {items.length ? (
                        items.map((it, i) => (
                          <div key={i} className="sec" style={{ fontSize: 13, lineHeight: 1.5, padding: "4px 0" }}>
                            {it}
                          </div>
                        ))
                      ) : (
                        <div className="muted" style={{ fontSize: 13 }}>—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 13.5 }}>
                Análise ainda não gerada — o worker analisa após baixar e transcrever.
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "22px 26px" }}>
            <h2 className="display" style={{ fontSize: 18, margin: "0 0 14px" }}>Transcrição</h2>
            {segments && segments.length ? (
              segments.map((line, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 14, padding: "7px 0", borderBottom: "1px solid var(--border)" }}
                >
                  <span className="muted tnum" style={{ fontSize: 12, flex: "none", width: 44 }}>
                    {mmss(line.start ?? 0)}
                  </span>
                  <span className="sec" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{line.text}</span>
                </div>
              ))
            ) : video.transcript ? (
              <p className="sec" style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                {video.transcript.text}
              </p>
            ) : (
              <div className="muted" style={{ fontSize: 13.5 }}>Transcrição ainda não disponível.</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SideCard label="Gancho">
            <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5, fontWeight: 500 }}>
              {a?.hookAnalysis ?? "—"}
            </div>
          </SideCard>
          <SideCard label="Estrutura">
            {splitSteps(a?.structure).length ? (
              splitSteps(a?.structure).map((s) => (
                <div
                  key={s.n}
                  className="sec"
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    padding: "5px 0",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: 9,
                  }}
                >
                  <span className="tnum" style={{ color: "var(--accent)", fontWeight: 700 }}>{s.n}</span>
                  {s.t}
                </div>
              ))
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>—</div>
            )}
          </SideCard>
          <SideCard label="Gatilhos">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(a?.triggers ?? []).length ? (
                a!.triggers.map((g, i) => <span key={i} className="chip sm">{g}</span>)
              ) : (
                <div className="muted" style={{ fontSize: 13 }}>—</div>
              )}
            </div>
          </SideCard>
        </div>
      </div>
    </>
  );
}

function SideCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="stat-label" style={{ marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
