/**
 * Prompts do Gemini para: análise por vídeo, análise agregada (30 dias) e
 * geração de roteiros. Todos pedem saída em JSON estrito (PT-BR).
 */

export interface PerVideoMetrics {
  gmv?: number;
  orders?: number;
  views?: number;
  convRate?: number | null;
  tier?: string | null;
  currency?: string;
}

export interface PerVideoInput {
  caption?: string | null;
  creatorHandle?: string | null;
  metrics: PerVideoMetrics;
  transcript: string;
}

export interface PerVideoAnalysisOutput {
  strengths: string[];
  replicate: string[];
  copyable: string[];
  avoid: string[];
  hookAnalysis: string;
  structure: string;
  triggers: string[];
  summary: string;
}

export interface AggregateVideoInput {
  rank: number;
  caption?: string | null;
  gmv?: number;
  tier?: string | null;
  transcriptExcerpt?: string;
  strengths?: string[];
}

export interface AggregateOutput {
  summary: string;
  winningStructure: string;
  themes: string[];
  recurringHooks: string[];
  avoidList: string[];
  recommendations: string[];
}

export interface ScriptOutput {
  title: string;
  mode: "human" | "ai";
  angle: string;
  hook: string;
  body: string;
  cta: string;
  shotList: { scene: string; action: string; onScreenText?: string }[];
  aiPrompt: string;
  durationSec: number;
}

const JSON_RULES =
  "Responda APENAS com JSON válido (UTF-8), sem markdown, sem comentários e sem texto fora do JSON. Todo o conteúdo em português do Brasil.";

export function buildPerVideoPrompt(input: PerVideoInput): string {
  const m = input.metrics;
  return `Você é um estrategista de conteúdo de UGC para TikTok Shop. Analise o vídeo abaixo (um dos que MAIS venderam) e explique por que ele performou, de forma acionável.

CONTEXTO DO VÍDEO
- Criador: ${input.creatorHandle ?? "desconhecido"}
- Legenda: ${input.caption ?? "(sem legenda)"}
- Métricas: GMV=${m.gmv ?? "?"} ${m.currency ?? ""}, pedidos=${m.orders ?? "?"}, views=${m.views ?? "?"}, conversão=${m.convRate ?? "?"}, tier=${m.tier ?? "?"}

TRANSCRIÇÃO
"""
${input.transcript}
"""

Gere a análise no seguinte formato JSON:
{
  "strengths": ["pontos fortes concretos do vídeo (o que funcionou)"],
  "replicate": ["o que vale replicar em outros vídeos"],
  "copyable": ["frases/estruturas copiáveis quase diretas, entre aspas quando for fala"],
  "avoid": ["o que NÃO é interessante falar/fazer (riscos, o que evitar)"],
  "hookAnalysis": "análise do gancho nos 3 primeiros segundos",
  "structure": "estrutura do roteiro (ex: gancho → objeção → prova → benefício → CTA)",
  "triggers": ["gatilhos mentais usados (ex: prova social, escassez, urgência)"],
  "summary": "resumo de 1-2 frases do porquê vendeu"
}

${JSON_RULES}`;
}

export function buildAggregatePrompt(videos: AggregateVideoInput[], windowDays = 30): string {
  const lines = videos
    .map(
      (v) =>
        `#${v.rank} | tier=${v.tier ?? "?"} | GMV=${v.gmv ?? "?"} | legenda: ${v.caption ?? "-"}\n   gancho/forças: ${(v.strengths ?? []).join("; ") || "-"}\n   trecho: ${v.transcriptExcerpt ?? "-"}`
    )
    .join("\n");

  return `Você é um estrategista de conteúdo. Abaixo estão os TOP vídeos de UGC que mais venderam no TikTok Shop nos últimos ${windowDays} dias. Encontre o padrão vencedor e transforme em um playbook acionável.

VÍDEOS (ordenados por desempenho):
${lines}

Gere o relatório no seguinte formato JSON:
{
  "summary": "panorama geral do que faz os vídeos venderem neste período",
  "winningStructure": "a estrutura de roteiro vencedora, passo a passo",
  "themes": ["temas/ângulos que mais vendem"],
  "recurringHooks": ["ganchos e frases de abertura recorrentes, entre aspas"],
  "avoidList": ["o que evitar (erros comuns, riscos de política)"],
  "recommendations": ["recomendações práticas do que seguir nos próximos UGCs, específicas e diretas"]
}

${JSON_RULES}`;
}

export function buildScriptsPrompt(
  report: AggregateOutput,
  opts: { humanCount?: number; aiCount?: number; productHint?: string } = {}
): string {
  const humanCount = opts.humanCount ?? 2;
  const aiCount = opts.aiCount ?? 2;
  return `Você é um roteirista de UGC para TikTok Shop. Com base no PLAYBOOK abaixo (derivado dos vídeos que mais venderam), crie roteiros prontos para produção.

PLAYBOOK
- Resumo: ${report.summary}
- Estrutura vencedora: ${report.winningStructure}
- Temas: ${report.themes.join(", ")}
- Ganchos recorrentes: ${report.recurringHooks.join(" | ")}
- Evitar: ${report.avoidList.join("; ")}
- Recomendações: ${report.recommendations.join("; ")}
${opts.productHint ? `- Produto/oferta: ${opts.productHint}` : ""}

Crie exatamente ${humanCount} roteiros com mode="human" (para uma PESSOA REAL gravar) e ${aiCount} roteiros com mode="ai" (para REPLICAR COM IA, ex: avatar/UGC IA/TTS).
Para mode="human": preencha hook, body (com marcações de tempo), cta e shotList (cenas/ações/texto na tela). Deixe aiPrompt como "".
Para mode="ai": preencha aiPrompt (prompt estruturado, pronto para colar em ferramenta de vídeo com IA — cena, avatar/voz, ritmo, texto na tela) e também hook, body, cta. shotList pode ser lista vazia.
Evite promessas de cura/resultado garantido.

Formato JSON (array):
[
  {
    "title": "título curto do roteiro",
    "mode": "human" | "ai",
    "angle": "ângulo/estratégia",
    "hook": "gancho dos 0-3s",
    "body": "roteiro com marcações [0-3s], [3-8s]...",
    "cta": "chamada para ação",
    "shotList": [{"scene": "descrição da cena", "action": "o que acontece", "onScreenText": "texto na tela"}],
    "aiPrompt": "prompt para ferramenta de IA (só quando mode=ai)",
    "durationSec": 30
  }
]

${JSON_RULES}`;
}
