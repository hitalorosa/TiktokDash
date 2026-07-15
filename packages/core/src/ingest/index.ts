import type { IngestAdapter } from "../types";
import { TikTokShopAdapter } from "./tiktok";

export * from "./csv";
export * from "./tiktok";

/** Resolve o adapter de ingestão pela env INGEST_SOURCE. CSV é tratado à parte (upload). */
export function getIngestAdapter(source = process.env.INGEST_SOURCE || "csv"): IngestAdapter {
  if (source === "tiktok_api") {
    return new TikTokShopAdapter({
      appKey: process.env.TIKTOK_APP_KEY,
      appSecret: process.env.TIKTOK_APP_SECRET,
      shopCipher: process.env.TIKTOK_SHOP_CIPHER,
      accessToken: process.env.TIKTOK_ACCESS_TOKEN,
    });
  }
  // Para CSV, a ingestão acontece via upload (parseAffiliateCsv), não via fetchWindow.
  return {
    source: "csv",
    async fetchWindow() {
      throw new Error("Ingestão CSV é feita por upload (parseAffiliateCsv), não por fetchWindow.");
    },
  };
}
