import Link from "next/link";
import { getDbOk, getTopVideos, computeStats, getLatestReport, getConfig } from "@/lib/data";
import { money, num, pct, dateBR } from "@/lib/format";
import { StatCard, SectionHeading, EmptyState, Chip, ListBlock, Card } from "@/components/ui";
import { ActionButton } from "@/components/ActionButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dbOk = await getDbOk();
  if (!dbOk) {
    return (
      <>
        <SectionHeading title="Visão geral" desc="TikTok Shop · UGC dos últimos 30 dias" />
        <EmptyState title="Banco de dados não conectado">
          Configure <code>DATABASE_URL</code> no arquivo <code>.env</code> e rode{" "}
          <code>npm run db:push</code> e <code>npm run db:seed</code>. Depois recarregue a página.
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
  const currency = config.currency;

  return (
    <>
      <SectionHeading
        title="Visão geral"
        desc={`TikTok Shop · UGC dos últimos ${config.windowDays} dias · Top ${config.topN} por GMV`}
        action={<ActionButton endpoint="/api/reprocess">🔄 Reprocessar 30 dias</ActionButton>}
      />

      {rows.length === 0 ? (
        <EmptyState title="Nenhum vídeo ainda">
          Importe um relatório do Affiliate Center em{" "}
          <Link href="/config" className="text-[var(--color-brand-2)] underline">
            Configurações
          </Link>{" "}
          ou rode <code>npm run db:seed</code> para ver dados de exemplo.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="GMV (Top 30)" value={money(stats.totalGmv, currency)} accent />
            <StatCard label="Vídeos" value={num(stats.count)} sub={`${stats.tier1} tier1 · ${stats.tier2} tier2`} />
            <StatCard label="Pedidos" value={num(stats.totalOrders)} />
            <StatCard label="Ticket médio" value={money(stats.avgTicket ?? 0, currency)} sub={`conv. média ${pct(stats.avgConv)}`} />
          </div>

          <div className="mt-8">
            {report ? (
              <Card>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">📈 Playbook dos {config.windowDays} dias</h2>
                    <p className="mt-1 text-sm muted">
                      Gerado em {dateBR(report.createdAt)} · {report.videoCount} vídeos analisados
                    </p>
                  </div>
                  <ActionButton endpoint="/api/scripts/generate" variant="ghost">
                    ✨ Gerar roteiros
                  </ActionButton>
                </div>

                {report.summary && <p className="mb-4 text-sm leading-relaxed">{report.summary}</p>}

                {report.winningStructure && (
                  <div className="card-2 mb-4 p-4">
                    <div className="mb-1 text-sm font-semibold">🏆 Estrutura vencedora</div>
                    <p className="text-sm">{report.winningStructure}</p>
                  </div>
                )}

                {report.recurringHooks.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 text-sm font-semibold">🎣 Ganchos recorrentes</div>
                    <div className="flex flex-wrap gap-2">
                      {report.recurringHooks.map((h, i) => (
                        <Chip key={i}>{h}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <ListBlock title="Temas que vendem" items={report.themes} icon="💡" />
                  <ListBlock title="Recomendações" items={report.recommendations} icon="✅" />
                  <ListBlock title="Evitar" items={report.avoidList} icon="⛔" />
                </div>
              </Card>
            ) : (
              <EmptyState title="Sem análise agregada ainda">
                Depois de importar e processar os vídeos, o worker gera o playbook dos 30 dias.
                Rode <code>npm run db:seed</code> para ver um exemplo.
              </EmptyState>
            )}
          </div>
        </>
      )}
    </>
  );
}
