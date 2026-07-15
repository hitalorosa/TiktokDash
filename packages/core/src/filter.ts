import type { FilterConfigInput, RankableMetrics, Ranked, RankBy, TierLabel } from "./types";

/** Classifica um GMV em tier segundo os limiares configurados. */
export function tierFor(gmv: number, tier1Gmv: number, tier2Gmv: number): TierLabel {
  if (gmv >= tier1Gmv) return "tier1";
  if (gmv >= tier2Gmv) return "tier2";
  return "below";
}

function score(m: RankableMetrics, rankBy: RankBy): number {
  switch (rankBy) {
    case "roas":
      return m.roas ?? 0;
    case "orders":
      return m.orders ?? 0;
    case "gmv":
    default:
      return m.gmv ?? 0;
  }
}

/**
 * Seleciona os Top N itens ranqueados por `rankBy` (desc), com desempate por GMV
 * e depois por pedidos. Retorna cada item com `rank` (1 = melhor) e `tier`.
 */
export function selectTopN<T extends RankableMetrics>(
  items: T[],
  config: FilterConfigInput
): Ranked<T>[] {
  const rankBy = config.rankBy ?? "gmv";
  const sorted = [...items].sort((a, b) => {
    const diff = score(b, rankBy) - score(a, rankBy);
    if (diff !== 0) return diff;
    const gmvDiff = (b.gmv ?? 0) - (a.gmv ?? 0);
    if (gmvDiff !== 0) return gmvDiff;
    return (b.orders ?? 0) - (a.orders ?? 0);
  });

  return sorted.slice(0, config.topN).map((item, i) => ({
    ...item,
    rank: i + 1,
    tier: tierFor(item.gmv ?? 0, config.tier1Gmv, config.tier2Gmv),
  }));
}
