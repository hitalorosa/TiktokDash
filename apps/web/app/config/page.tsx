import { getConfig } from "@/lib/data";
import { PageHead } from "@/components/ui";
import { ConfigForm } from "@/components/ConfigForm";
import { UploadCsvForm } from "@/components/UploadCsvForm";
import { ActionButton } from "@/components/ActionButton";
import { ProcessAll } from "@/components/ProcessAll";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const config = await getConfig();
  const ingestSource = process.env.INGEST_SOURCE || "csv";

  return (
    <div style={{ maxWidth: 760 }}>
      <PageHead eyebrow="Configuração" title="Critérios do ranking" />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

        <div className="card" style={{ padding: "24px 26px" }}>
          <h2 className="display" style={{ fontSize: 18, margin: "0 0 4px" }}>Importar dados</h2>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>
            Fonte atual:{" "}
            <b style={{ color: "var(--sec)" }}>
              {ingestSource === "tiktok_api" ? "API TikTok Shop" : "CSV (Affiliate Center)"}
            </b>
            . Exporte o relatório de conteúdo dos últimos {config.windowDays} dias e importe abaixo — as colunas
            são mapeadas automaticamente (PT/EN).
          </p>
          <UploadCsvForm />
        </div>

        <div className="card" style={{ padding: "24px 26px" }}>
          <h2 className="display" style={{ fontSize: 18, margin: "0 0 4px" }}>Processamento com IA</h2>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>
            “Processar tudo” reordena o Top {config.topN}, analisa cada vídeo com o Gemini, gera o playbook
            dos {config.windowDays} dias e os roteiros. Também dá para rodar cada etapa separada.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <ProcessAll />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <ActionButton endpoint="/api/reprocess" variant="ghost">Só reordenar</ActionButton>
            <ActionButton endpoint="/api/aggregate" variant="ghost">Gerar playbook</ActionButton>
            <ActionButton endpoint="/api/scripts/generate" variant="ghost">Gerar roteiros</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
