import type { IngestAdapter, NormalizedVideoRow } from "../types";

/**
 * Adapter da TikTok Shop Open Platform (afiliados / conteúdo).
 *
 * ⚠️ Stub: a integração real exige um app aprovado no TikTok Shop Partner Center
 * (OAuth com app_key/app_secret + autorização da loja). Enquanto o app não é
 * aprovado, use o adapter CSV (`INGEST_SOURCE=csv`).
 *
 * Quando as credenciais existirem, implemente `fetchWindow` chamando os endpoints
 * de performance de conteúdo de afiliado e mapeando para NormalizedVideoRow.
 */
export class TikTokShopAdapter implements IngestAdapter {
  source = "tiktok_api" as const;

  constructor(
    private readonly creds: {
      appKey?: string;
      appSecret?: string;
      shopCipher?: string;
      accessToken?: string;
    } = {}
  ) {}

  isConfigured(): boolean {
    return Boolean(this.creds.appKey && this.creds.appSecret && this.creds.accessToken);
  }

  async fetchWindow(_opts: { windowStart: Date; windowEnd: Date }): Promise<NormalizedVideoRow[]> {
    if (!this.isConfigured()) {
      throw new Error(
        "TikTok Shop API não configurada. Registre o app no Partner Center e defina TIKTOK_APP_KEY/SECRET/ACCESS_TOKEN, ou use INGEST_SOURCE=csv."
      );
    }
    // TODO: implementar chamadas reais (assinatura HMAC, paginação, mapeamento).
    throw new Error("TikTokShopAdapter.fetchWindow ainda não implementado.");
  }
}
