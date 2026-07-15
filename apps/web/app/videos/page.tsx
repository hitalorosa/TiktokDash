import Link from "next/link";
import { getTopVideos, getConfig } from "@/lib/data";
import { money, num, pct } from "@/lib/format";
import { SectionHeading, TierBadge, StatusBadge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const [config, rows] = await Promise.all([getConfig(), getTopVideos(60)]);
  const top = rows.slice(0, config.topN);
  const currency = config.currency;

  return (
    <>
      <SectionHeading
        title={`Top ${config.topN} vídeos`}
        desc="Ordenados por GMV. Clique em um vídeo para transcrição, análise e download."
      />

      {top.length === 0 ? (
        <EmptyState title="Nenhum vídeo importado">
          Vá em Configurações e importe um CSV do Affiliate Center, ou rode{" "}
          <code>npm run db:seed</code>.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Criador / vídeo</th>
                <th className="px-4 py-3 font-medium">GMV</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Conv.</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)]/60 transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-xs font-semibold">
                      {r.rank ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/videos/${r.video.id}`} className="block">
                      <div className="font-medium">@{r.video.creator?.handle ?? "criador"}</div>
                      <div className="max-w-[280px] truncate text-xs muted">
                        {r.video.caption ?? "(sem legenda)"}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold">{money(r.gmv, currency)}</td>
                  <td className="px-4 py-3">
                    <TierBadge tier={r.tier} />
                  </td>
                  <td className="px-4 py-3">{num(r.orders)}</td>
                  <td className="px-4 py-3">{pct(r.convRate)}</td>
                  <td className="px-4 py-3">{num(r.views)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.video.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
