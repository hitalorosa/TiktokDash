import Link from "next/link";
import { getTopVideos, getConfig } from "@/lib/data";
import { money, num, pct } from "@/lib/format";
import { PageHead, EmptyState, TierPill, StatusDot } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const [config, rows] = await Promise.all([getConfig(), getTopVideos(60)]);
  const top = rows.slice(0, config.topN);
  const cur = config.currency;
  const gmvMax = top[0]?.gmv || 1;

  return (
    <>
      <PageHead
        eyebrow={`Ranking · ${top.length} vídeos`}
        title="Top 30 UGC"
        actions={<span className="muted" style={{ fontSize: 12 }}>ordenado por GMV</span>}
      />

      {top.length === 0 ? (
        <EmptyState title="Nenhum vídeo importado">
          Importe um CSV do Affiliate Center em Config, ou rode <code>npm run db:seed</code>.
        </EmptyState>
      ) : (
        <div className="t30">
          <div className="t30-scroll">
            <div className="t30-head">
              <span>#</span>
              <span>Criador</span>
              <span>GMV</span>
              <span>Tier</span>
              <span style={{ textAlign: "right" }}>Pedidos</span>
              <span style={{ textAlign: "right" }}>Conv.</span>
              <span style={{ textAlign: "right" }}>Status</span>
            </div>
            {top.map((r, i) => {
              const alpha = Math.max(34, 100 - i * 2.3).toFixed(0);
              return (
                <Link key={r.id} href={`/videos/${r.video.id}`} className="t30-row">
                  <span className="rank">{r.rank ?? i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      @{r.video.creator?.handle ?? "criador"}
                    </span>
                    <span
                      className="muted"
                      style={{
                        display: "block",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.video.caption ?? "(sem legenda)"}
                    </span>
                  </span>
                  <span>
                    <span
                      className="tnum"
                      style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}
                    >
                      {money(r.gmv, cur)}
                    </span>
                    <span className="gmv-bar">
                      <span
                        style={{
                          width: `${Math.round((r.gmv / gmvMax) * 100)}%`,
                          background: `color-mix(in oklab, var(--accent) ${alpha}%, transparent)`,
                        }}
                      />
                    </span>
                  </span>
                  <span><TierPill tier={r.tier} /></span>
                  <span className="num-right">{num(r.orders)}</span>
                  <span className="num-right">{pct(r.convRate)}</span>
                  <span style={{ textAlign: "right" }}>
                    <StatusDot status={r.video.status} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
