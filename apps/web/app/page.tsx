import Link from "next/link";
import { getDbOk, getTopVideos, computeStats, getLatestReport, getConfig } from "@/lib/data";
import { money, compactMoney, num, pct } from "@/lib/format";
import { PageHead, EmptyState, splitSteps } from "@/components/ui";
import { ActionButton } from "@/components/ActionButton";
import { ProcessAll } from "@/components/ProcessAll";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dbOk = await getDbOk();
  if (!dbOk) {
    return (
      <>
        <PageHead eyebrow="Visão geral · últimos 30 dias" title="Top 30 que mais venderam" />
        <EmptyState title="Banco de dados não conectado">
          Defina <code>DATABASE_URL</code> no <code>.env</code> e rode <code>npm run db:push</code> +{" "}
          <code>npm run db:seed</code>.
        </EmptyState>
      </>
    );
  }

  const [config, rows, report] = await Promise.all([
    getConfig(),
    getTopVideos(30),
    getLatestReport(),
  ]);
  const stats = computeStats(rows);
  const cur = config.currency;
  const below = Math.max(0, stats.count - stats.tier1 - stats.tier2);
  const pctOf = (n: number) => (stats.count ? (n / stats.count) * 100 : 0);

  return (
    <>
      <PageHead
        eyebrow={`Visão geral · últimos ${config.windowDays} dias`}
        title="Top 30 que mais venderam"
        actions={<ProcessAll />}
      />

      {rows.length === 0 ? (
        <EmptyState title="Nenhum vídeo ainda">
          Importe um relatório em{" "}
          <Link href="/config" style={{ color: "var(--accent)" }}>
            Config
          </Link>{" "}
          ou rode <code>npm run db:seed</code>.
        </EmptyState>
      ) : (
        <>
          {/* stat tiles */}
          <div className="statgrid">
            <div className="stat">
              <div className="stat-label">GMV · Top {config.topN}</div>
              <div className="stat-value accent">{compactMoney(stats.totalGmv, cur)}</div>
              <div className="stat-foot">
                <span className="sec" style={{ fontWeight: 600 }}>{num(stats.count)} vídeos</span>
                <span className="muted">últimos {config.windowDays} dias</span>
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">Distribuição por tier</div>
              <div className="stat-value">{num(stats.count)}</div>
              <div className="tierbar">
                <span style={{ width: `${pctOf(stats.tier1)}%`, background: "#1BAF7A" }} />
                <span style={{ width: `${pctOf(stats.tier2)}%`, background: "#EDA100" }} />
                <span style={{ width: `${pctOf(below)}%`, background: "var(--muted)" }} />
              </div>
              <div
                className="tnum"
                style={{ marginTop: 9, display: "flex", gap: 12, fontSize: 11, color: "var(--sec)" }}
              >
                <span>{stats.tier1} T1</span>
                <span>{stats.tier2} T2</span>
                <span>{below} abaixo</span>
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">Pedidos</div>
              <div className="stat-value">{num(stats.totalOrders)}</div>
              <div className="stat-foot">
                <span className="muted">conversão média</span>
                <span className="sec tnum" style={{ fontWeight: 600 }}>{pct(stats.avgConv)}</span>
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">Ticket médio</div>
              <div className="stat-value">{money(stats.avgTicket ?? 0, cur)}</div>
              <div className="stat-foot">
                <span className="muted">por pedido</span>
              </div>
            </div>
          </div>

          {/* Playbook */}
          {report ? (
            <div className="card" style={{ padding: "26px 28px" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 10,
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 18,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
                    Playbook dos {config.windowDays} dias
                  </h2>
                  <span className="muted" style={{ fontSize: 11 }}>gerado por IA</span>
                </div>
                <ActionButton endpoint="/api/scripts/generate" variant="ghost">
                  Gerar roteiros
                </ActionButton>
              </div>

              {report.summary && (
                <p
                  className="sec"
                  style={{ margin: "0 0 22px", maxWidth: "70ch", fontSize: 15, lineHeight: 1.6 }}
                >
                  {report.summary}
                </p>
              )}

              {report.winningStructure && (
                <div style={{ marginBottom: 22 }}>
                  <div className="stat-label" style={{ marginBottom: 12 }}>Estrutura vencedora</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {splitSteps(report.winningStructure).map((s) => (
                      <div
                        key={s.n}
                        className="card2"
                        style={{ flex: 1, minWidth: 150, padding: "13px 14px" }}
                      >
                        <div
                          className="tnum"
                          style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 5 }}
                        >
                          {s.n}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>
                          {s.t}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recurringHooks.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="stat-label" style={{ marginBottom: 12 }}>Ganchos que converteram</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {report.recurringHooks.map((h, i) => (
                      <span key={i} className="chip">{h}</span>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 18,
                }}
              >
                <PlaybookCol title="Temas" color="#1BAF7A" items={report.themes} />
                <PlaybookCol title="Recomendações" color="#2A78D6" items={report.recommendations} />
                <PlaybookCol title="Evitar" color="var(--crit)" items={report.avoidList} />
              </div>
            </div>
          ) : (
            <EmptyState title="Sem playbook ainda">
              Após processar os vídeos, o worker gera a análise dos 30 dias. Rode{" "}
              <code>npm run db:seed</code> para ver um exemplo.
            </EmptyState>
          )}
        </>
      )}
    </>
  );
}

function PlaybookCol({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        {title}
      </div>
      {items.map((li, i) => (
        <div
          key={i}
          className="sec"
          style={{ fontSize: 13.5, lineHeight: 1.5, padding: "6px 0", borderBottom: "1px solid var(--border)" }}
        >
          {li}
        </div>
      ))}
    </div>
  );
}
