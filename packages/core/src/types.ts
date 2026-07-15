export type RankBy = "gmv" | "roas" | "orders";
export type TierLabel = "tier1" | "tier2" | "below";

/** Linha de vídeo normalizada, vinda de qualquer fonte de ingestão (CSV ou API). */
export interface NormalizedVideoRow {
  tiktokVideoId?: string;
  url?: string;
  creatorHandle?: string;
  creatorName?: string;
  caption?: string;
  postedAt?: Date;
  productIds?: string[];
  gmv: number;
  orders?: number;
  unitsSold?: number;
  productClicks?: number;
  views?: number;
  convRate?: number;
  commission?: number;
  roas?: number | null;
  currency?: string;
}

export interface FilterConfigInput {
  topN: number;
  rankBy: RankBy;
  tier1Gmv: number;
  tier2Gmv: number;
  currency?: string;
}

/** Métricas mínimas necessárias para ranquear. */
export interface RankableMetrics {
  gmv: number;
  roas?: number | null;
  orders?: number;
}

export type Ranked<T> = T & { rank: number; tier: TierLabel };

/** Adapter de ingestão — implementado por CSV e (futuramente) TikTok Shop API. */
export interface IngestAdapter {
  source: "csv" | "tiktok_api";
  fetchWindow(opts: { windowStart: Date; windowEnd: Date }): Promise<NormalizedVideoRow[]>;
}
