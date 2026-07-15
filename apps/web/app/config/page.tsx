import { getConfig } from "@/lib/data";
import { SectionHeading, Card } from "@/components/ui";
import { ConfigForm } from "@/components/ConfigForm";
import { UploadCsvForm } from "@/components/UploadCsvForm";
import { ActionButton } from "@/components/ActionButton";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const config = await getConfig();
  const ingestSource = process.env.INGEST_SOURCE || "csv";

  return (
    <>
      <SectionHeading
        title="Configurações"
        desc="Ajuste os critérios de seleção e importe os dados do TikTok Shop."
      />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">🎯 Critérios de seleção</h2>
          <ConfigForm
            initial={{
              topN: config.topN,
              rankBy: config.rankBy,
              tier1Gmv: config.tier1Gmv,
              tier2Gmv: config.tier2Gmv,
              windowDays: config.windowDays,
              currency: config.currency,
            }}
          />
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold">📥 Importar dados</h2>
          <p className="mb-4 text-sm muted">
            Fonte atual: <b>{ingestSource === "tiktok_api" ? "API TikTok Shop" : "CSV (Affiliate Center)"}</b>.
            Exporte o relatório de conteúdo/afiliados dos últimos {config.windowDays} dias e importe abaixo.
            As colunas são mapeadas automaticamente (PT/EN).
          </p>
          <UploadCsvForm />
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold">⚙️ Processamento</h2>
          <p className="mb-4 text-sm muted">
            Reprocessar reordena o Top {config.topN}, e enfileira download, transcrição e análise no worker.
          </p>
          <div className="flex flex-wrap gap-3">
            <ActionButton endpoint="/api/reprocess">🔄 Reprocessar 30 dias</ActionButton>
            <ActionButton endpoint="/api/scripts/generate" variant="ghost">
              ✨ Gerar roteiros
            </ActionButton>
          </div>
        </Card>
      </div>
    </>
  );
}
