/**
 * Seed de demonstração — popula o banco com dados fictícios plausíveis
 * para o dashboard renderizar completo antes da integração com o TikTok.
 *
 * Rode com: npm run db:seed
 */
import { prisma, Tier, VideoStatus, TranscriptProvider, ScriptMode, ScriptStatus } from "../src/index";

const CREATORS = [
  { handle: "manu.beauty", displayName: "Manu" },
  { handle: "carol.skincare", displayName: "Carol Dias" },
  { handle: "juliaugc", displayName: "Júlia" },
  { handle: "pedro.reviews", displayName: "Pedro" },
  { handle: "lari.testa", displayName: "Larissa" },
  { handle: "bruna.rotina", displayName: "Bruna" },
  { handle: "gaby.achados", displayName: "Gabriela" },
  { handle: "rafa.indica", displayName: "Rafael" },
];

const CAPTIONS = [
  "eu não acreditava até testar 👀 #nouè",
  "3 motivos pra usar isso todo dia ✨",
  "POV: você finalmente achou o produto certo",
  "ninguém me contou isso antes 😱",
  "testei por 7 dias e o resultado…",
  "por que TODO MUNDO tá comprando isso?",
  "o segredo que mudou minha rotina",
  "gastei pra você não gastar errado 💸",
  "isso aqui vale cada centavo, juro",
  "antes x depois (real, sem filtro)",
  "parei de comprar os caros por causa disso",
  "a promoção que você não pode perder",
];

const HOOKS_DEMO = [
  "Começa com pergunta direta olhando pra câmera nos primeiros 2s.",
  "Abre com o 'antes' chocante antes de mostrar o produto.",
  "Usa 'ninguém te conta isso' criando curiosidade imediata.",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randint(min: number, max: number) {
  return Math.round(rand(min, max));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function tierFor(gmv: number): Tier {
  if (gmv >= 10000) return Tier.tier1;
  if (gmv >= 5000) return Tier.tier2;
  return Tier.below;
}

async function main() {
  console.log("🌱  Limpando dados antigos…");
  await prisma.script.deleteMany();
  await prisma.aggregateReport.deleteMany();
  await prisma.videoAnalysis.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.videoMetric.deleteMany();
  await prisma.video.deleteMany();
  await prisma.creator.deleteMany();

  console.log("🌱  Config de filtro…");
  await prisma.filterConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

  console.log("🌱  Criadores…");
  const creators = await Promise.all(
    CREATORS.map((c) =>
      prisma.creator.create({ data: { handle: c.handle, displayName: c.displayName } })
    )
  );

  console.log("🌱  Vídeos + métricas (35)…");
  const N = 35;
  // GMV base decrescente com ruído — gera spread entre tiers.
  const videos = Array.from({ length: N }).map((_, i) => {
    const baseGmv = Math.max(600, 24000 * Math.pow(0.9, i) + rand(-800, 800));
    const gmv = Math.round(baseGmv);
    const convRate = rand(0.02, 0.08);
    const orders = Math.max(1, Math.round(gmv / rand(90, 160)));
    const productClicks = Math.round(orders / convRate);
    const views = Math.round(productClicks / rand(0.03, 0.09));
    const commission = Math.round(gmv * rand(0.1, 0.16));
    const creator = pick(creators);
    const postedAt = new Date(
      windowStart.getTime() + rand(0, 30 * 24 * 60 * 60 * 1000)
    );
    const tiktokId = String(7300000000000000000n + BigInt(randint(1, 9_000_000)));
    return {
      tiktokVideoId: tiktokId,
      url: `https://www.tiktok.com/@${creator.handle}/video/${tiktokId}`,
      creatorId: creator.id,
      caption: pick(CAPTIONS),
      postedAt,
      productIds: [`PROD-${randint(1, 40).toString().padStart(3, "0")}`],
      durationSec: randint(18, 55),
      gmv,
      orders,
      unitsSold: orders + randint(0, orders),
      productClicks,
      views,
      convRate: Number(convRate.toFixed(4)),
      commission,
    };
  });

  // Ordena por GMV desc para atribuir rank + tier (simula seleção Top N).
  videos.sort((a, b) => b.gmv - a.gmv);

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i]!;
    const rank = i + 1;
    const tier = tierFor(v.gmv);
    const isTop = rank <= 5;
    const created = await prisma.video.create({
      data: {
        tiktokVideoId: v.tiktokVideoId,
        url: v.url,
        creatorId: v.creatorId,
        caption: v.caption,
        postedAt: v.postedAt,
        productIds: v.productIds,
        durationSec: v.durationSec,
        status: isTop ? VideoStatus.analyzed : VideoStatus.discovered,
        metrics: {
          create: {
            windowStart,
            windowEnd,
            gmv: v.gmv,
            orders: v.orders,
            unitsSold: v.unitsSold,
            productClicks: v.productClicks,
            views: v.views,
            convRate: v.convRate,
            commission: v.commission,
            roas: null,
            rank,
            tier,
            currency: "BRL",
          },
        },
      },
    });

    if (isTop) {
      await prisma.transcript.create({
        data: {
          videoId: created.id,
          lang: "pt",
          provider: TranscriptProvider.whisper,
          text:
            "Gente, eu preciso te contar sobre isso porque mudou completamente a minha rotina. " +
            "No começo eu tava super cética, achei que era só mais um hype. Mas depois de usar por uns dias, " +
            "o resultado apareceu de verdade. O que eu mais gostei foi a praticidade e o custo-benefício. " +
            "Se você tava na dúvida, esse é o sinal. Corre no link que tá com desconto e a entrega é rápida.",
          segments: [
            { start: 0, end: 3, text: "Gente, eu preciso te contar sobre isso" },
            { start: 3, end: 9, text: "porque mudou completamente a minha rotina." },
            { start: 9, end: 16, text: "No começo eu tava super cética, achei que era só mais um hype." },
            { start: 16, end: 24, text: "Mas depois de uns dias o resultado apareceu de verdade." },
            { start: 24, end: 32, text: "Corre no link que tá com desconto e a entrega é rápida." },
          ],
        },
      });
      await prisma.videoAnalysis.create({
        data: {
          videoId: created.id,
          model: "seed-demo",
          hookAnalysis: pick(HOOKS_DEMO),
          structure: "Gancho (0-3s) → objeção/ceticismo → prova/resultado → benefício → CTA com urgência.",
          summary:
            "Vídeo de depoimento pessoal com quebra de objeção e CTA de urgência. Alto GMV por prova social autêntica.",
          strengths: [
            "Gancho pessoal e autêntico nos primeiros 3 segundos",
            "Quebra de objeção ('eu tava cética') gera identificação",
            "CTA claro com gatilho de urgência e menção à entrega rápida",
          ],
          replicate: [
            "Abrir com 'eu preciso te contar' + expressão facial de surpresa",
            "Incluir a fase de ceticismo antes do resultado",
            "Fechar com desconto + prazo de entrega",
          ],
          copyable: [
            "\"eu tava super cética, achei que era só mais um hype\"",
            "\"se você tava na dúvida, esse é o sinal\"",
          ],
          avoid: [
            "Não prometer resultado garantido/curativo (risco de política)",
            "Evitar jargão técnico logo no início — perde retenção",
          ],
          triggers: ["prova social", "quebra de objeção", "urgência", "escassez"],
        },
      });
    }
  }

  console.log("🌱  Relatório agregado + roteiros…");
  const report = await prisma.aggregateReport.create({
    data: {
      windowStart,
      windowEnd,
      videoCount: 30,
      model: "seed-demo",
      summary:
        "Nos últimos 30 dias, os vídeos que mais venderam seguem um padrão de depoimento pessoal autêntico, " +
        "com quebra de objeção e CTA de urgência. Ganchos na primeira pessoa e menção ao desconto/entrega " +
        "aparecem nos top performers.",
      winningStructure:
        "Gancho pessoal (0-3s) → objeção/ceticismo → prova/resultado → benefício prático → CTA com urgência.",
      themes: [
        "Depoimento 'antes e depois'",
        "Custo-benefício vs. concorrentes caros",
        "Rotina do dia a dia",
        "Descoberta / segredo",
      ],
      recurringHooks: [
        "\"eu não acreditava até testar\"",
        "\"ninguém me contou isso antes\"",
        "\"POV: você achou o produto certo\"",
        "\"gastei pra você não gastar errado\"",
      ],
      avoidList: [
        "Promessas de cura/resultado garantido",
        "Começar com informação técnica (mata a retenção)",
        "CTA fraco sem urgência",
      ],
      recommendations: [
        "Padronize o gancho na primeira pessoa nos 3s iniciais",
        "Sempre inclua a fase de ceticismo antes da prova",
        "Feche com desconto + prazo de entrega",
        "Priorize criadores no estilo depoimento autêntico (ver top 5)",
        "Teste 2-3 ângulos por semana com o mesmo esqueleto vencedor",
      ],
    },
  });

  await prisma.script.createMany({
    data: [
      {
        aggregateReportId: report.id,
        title: "Depoimento autêntico — 'eu tava cética'",
        mode: ScriptMode.human,
        angle: "Quebra de objeção + prova social",
        hook: "Eu preciso te contar sobre isso porque mudou a minha rotina…",
        body:
          "[0-3s] Olhar pra câmera: 'Eu preciso te contar sobre isso.'\n" +
          "[3-8s] 'No começo eu tava super cética, achei que era hype.'\n" +
          "[8-16s] Mostra o produto em uso + resultado real.\n" +
          "[16-24s] 'O que eu mais gostei foi a praticidade e o preço.'\n" +
          "[24-30s] CTA: 'Corre no link, tá com desconto e chega rápido.'",
        cta: "Corre no link — desconto ativo e entrega rápida.",
        shotList: [
          { scene: "Close no rosto", action: "Fala o gancho", onScreenText: "eu não acreditava…" },
          { scene: "Produto na mão", action: "Mostra aplicação", onScreenText: "testei 7 dias" },
          { scene: "Resultado", action: "Antes/depois", onScreenText: "resultado real" },
          { scene: "Close final", action: "CTA apontando pro link", onScreenText: "link com desconto" },
        ],
        durationSec: 30,
        status: ScriptStatus.draft,
      },
      {
        aggregateReportId: report.id,
        title: "Descoberta — 'ninguém me contou isso'",
        mode: ScriptMode.human,
        angle: "Curiosidade / segredo",
        hook: "Ninguém me contou isso antes e eu fiquei chocada…",
        body:
          "[0-3s] 'Ninguém me contou isso antes.'\n" +
          "[3-10s] Explica o problema comum do público.\n" +
          "[10-20s] Revela o produto como 'segredo'.\n" +
          "[20-28s] Benefício + custo-benefício.\n" +
          "[28-32s] CTA com urgência.",
        cta: "Link na bio, promoção acaba hoje.",
        shotList: [
          { scene: "Câmera na mão andando", action: "Gancho", onScreenText: "ninguém te conta" },
          { scene: "Bancada", action: "Mostra produto", onScreenText: "o segredo" },
          { scene: "Close", action: "CTA", onScreenText: "só hoje" },
        ],
        durationSec: 32,
        status: ScriptStatus.draft,
      },
      {
        aggregateReportId: report.id,
        title: "UGC com IA — depoimento avatar",
        mode: ScriptMode.ai,
        angle: "Depoimento autêntico (replicável em ferramenta de avatar/IA)",
        aiPrompt:
          "Gere um vídeo UGC vertical (9:16, ~30s), avatar feminino 20-30 anos, ambiente caseiro (quarto/banheiro), " +
          "luz natural. Tom: amigável, empolgado, espontâneo. Roteiro (voz PT-BR, ritmo rápido):\n" +
          "1) [0-3s] Olhando pra câmera: 'Eu preciso te contar sobre isso.'\n" +
          "2) [3-8s] 'No começo eu tava cética, achei que era hype.'\n" +
          "3) [8-16s] B-roll do produto em uso.\n" +
          "4) [16-24s] 'A praticidade e o preço me ganharam.'\n" +
          "5) [24-30s] CTA: 'Corre no link, tá com desconto.'\n" +
          "Texto na tela sincronizado com as falas-chave. Legendas grandes. Sem promessa de cura.",
        durationSec: 30,
        status: ScriptStatus.draft,
      },
      {
        aggregateReportId: report.id,
        title: "UGC com IA — antes e depois",
        mode: ScriptMode.ai,
        angle: "Transformação / prova visual",
        aiPrompt:
          "Vídeo UGC vertical 9:16 (~25s) com avatar IA. Estrutura antes/depois:\n" +
          "1) [0-3s] Gancho: 'Antes x depois, sem filtro.'\n" +
          "2) [3-12s] Mostra o 'antes' e a jornada de uso (b-roll).\n" +
          "3) [12-20s] Revela o 'depois' + reação genuína.\n" +
          "4) [20-25s] CTA com urgência e menção a entrega rápida.\n" +
          "Estilo caseiro, legendas grandes PT-BR, trilha trending. Evitar claims de resultado garantido.",
        durationSec: 25,
        status: ScriptStatus.draft,
      },
    ],
  });

  console.log("✅  Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
