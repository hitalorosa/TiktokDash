# Design Brief — Nouè · UGC Dashboard

Guia de design pronto para (a) colar no Claude / ferramenta de design e gerar telas, ou
(b) implementar direto no `apps/web`. Tokens em hex, claro + escuro, com paleta de gráficos
**validada para daltonismo e contraste**. No fim há um **prompt pronto pra colar**.

---

## 1. Produto, público e a única função

- **Produto:** painel interno que mostra os **Top 30** vídeos de criadores (UGC) que mais venderam
  no TikTok Shop da **Nouè** (beleza/skincare), com transcrição, análise de IA e **roteiros** gerados.
- **Público:** time de marketing/growth da Nouè — pessoas que **operam e escaneiam**, não leem de cima a baixo.
- **A função (uma só):** _"em 5 segundos, entender o que fez os vídeos venderem e o que gravar a seguir."_
- **Regra de ouro (UI, não documento):** resumo antes do detalhe; estado codificado em **forma além de número**
  (pill, chip, faixa) para o que precisa de atenção saltar aos olhos.

---

## 2. Direção de design (a tese)

**"Editorial beauty meets data terminal."** Um painel de marca de beleza premium: base neutra quente
(levíssimo viés rosé — escolhida, não default), **um** acento confiante cor de framboesa, e dados
precisos e calmos. Tipografia com uma serifada editorial usada com **restrição** para títulos, e uma
grotesca limpa para toda a operação. Nada de gradiente roxo-azul, nada de emoji como marcador de seção,
nada de "rounded-lg em tudo". A ousadia mora **só no acento**; o resto é quieto.

---

## 3. Cores — tokens (claro + escuro)

Neutros com viés quente/plum (não cinza puro). O acento é framboesa; **cores de status são reservadas**
e nunca viram acento nem série de gráfico.

### Neutros & superfícies
| Papel | Claro | Escuro |
|---|---|---|
| Plano de página (bg) | `#F7F3F1` | `#0F0C10` |
| Superfície / card | `#FFFFFF` | `#17141A` |
| Superfície 2 (sub-card) | `#F3EDEB` | `#221D26` |
| Borda (hairline) | `#E7DEDA` | `#2E2833` |
| Ink primário (texto) | `#1A1416` | `#F5F1F3` |
| Ink secundário | `#6B5F62` | `#B9AEB4` |
| Muted (labels/eixos) | `#9A8E90` | `#8A7F86` |

### Acento de marca (framboesa Nouè) — a única cor "cheia"
| Papel | Claro | Escuro |
|---|---|---|
| Acento (fills, botão primário) | `#D6336C` | `#E85D8A` |
| Acento pressed/hover | `#B4185B` | `#D6336C` |
| Acento texto/link | `#B4185B` | `#F0A0BC` |
| Acento wash (fundo suave) | `#FBEAF1` | `#2A1620` |

> Botão primário: fill framboesa `#D6336C` + texto **branco** (contraste ~4.2:1, ok para label semibold ≥14px).
> Use o acento **em um lugar por tela** (ação principal, valor de destaque) — não espalhe.

### Status (fixo, nunca tematizado) — sempre com ícone + rótulo, nunca cor sozinha
| Papel | Hex | Uso no dash |
|---|---|---|
| good | `#0CA30C` | Tier 1 · meta · "Analisado" |
| warning | `#FAB219` | Tier 2 · fallback |
| serious | `#EC835A` | atenção intermediária |
| critical | `#D03B3B` | "Falhou" |
| neutro | usar `muted` | "Abaixo da meta" / "Descoberto" |

---

## 4. Paleta de gráficos (VALIDADA — não mexer na ordem)

Categórica (identidade, ex.: comparar criadores). Ordem = mecanismo de segurança p/ daltonismo.
Validada com o método (worst adjacent ΔE **24.2** claro / **10.3** escuro; teto ≥12).

| Slot | Hue | Claro | Escuro |
|---|---|---|---|
| 1 | azul | `#2A78D6` | `#3987E5` |
| 2 | teal | `#1BAF7A` | `#199E70` |
| 3 | âmbar | `#EDA100` | `#C98500` |
| 4 | verde | `#008300` | `#008300` |
| 5 | violeta | `#4A3AA7` | `#9085E9` |
| 6 | vermelho | `#E34948` | `#E66767` |

- **Sequencial** (magnitude, ex.: barra de GMV na tabela): um hue só, claro→escuro. Use o **azul** do slot 1
  como rampa (`#CDE2FB`→`#0D366B`) **ou**, para dar cara de marca, uma rampa **framboesa** monocromática
  (`#FBEAF1`→`#8A0E45`) — escolha UMA e use consistente.
- **Regras invariáveis:** nunca eixo duplo; cor segue a **entidade**, não o rank; ≥2 séries sempre têm legenda
  (1 série, nenhuma); rótulos diretos em vez de número em todo ponto; grid/eixos recessivos (hairline).
- No claro, teal e âmbar ficam <3:1 no fundo → **rótulo direto ou table view** (regra de relevo). No escuro,
  4+ séries pedem rótulo direto/textura.

---

## 5. Tipografia

Par deliberado (evita Inter/Space Grotesk "seguros"):

- **Display (editorial, com restrição):** **Fraunces** — wordmark "Nouè", títulos de página, headline de
  estado vazio. Peso 400–600, `text-wrap: balance`, leve `letter-spacing` negativo em tamanhos grandes.
- **UI / corpo:** **Hanken Grotesk** (fallback: `Geist`, `system-ui`) — toda a operação: nav, tabela, labels.
- **Números / dados:** o corpo com `font-variant-numeric: tabular-nums` em colunas e eixos. Campos "código"
  (ex.: prompt de IA do roteiro) em mono (`Geist Mono`/`IBM Plex Mono`).

**Escala** (rem): 0.75 · 0.8125 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.25. Corpo 0.875–1; título de página 1.375–1.75.
Labels de KPI: 0.75rem, **UPPERCASE**, `letter-spacing: .06em`, cor muted.
**KPI hero (valores grandes):** no **sans** com `tabular-nums` (legibilidade de dado), não na serifada.
Reserve a Fraunces para títulos/estado vazio — caráter editorial sem custar legibilidade de dado.

> Em artifact/CSP: fontes externas são bloqueadas — inline `@font-face` como data URI **ou** use a stack de sistema.
> No `apps/web` (Next.js), use `next/font/google` (Fraunces + Hanken Grotesk).

---

## 6. Espaçamento, raios, elevação

- **Espaço:** escala de 4px (4·8·12·16·24·32·48). Respire: padding de card 20–24px; gap de grid 16–24px.
  Layout com **flex/grid + `gap`**, nunca margens por-elemento que colapsam.
- **Raios:** card 14px; sub-card/inputs 10px; pill/badge 999px; **evite** o mesmo raio em tudo — botão 10px, card 14px.
- **Elevação:** preferir **hairline border + superfície tonal** a sombra pesada. Sombra sutil só em overlays/hover:
  `0 1px 2px rgba(26,20,22,.06), 0 8px 24px -12px rgba(26,20,22,.18)`.
- **Bordas:** hairline 1px na cor `border`. Nada de "barra de acento colorida" na lateral do card (clichê).

---

## 7. Layout & grid

- **Sidebar** fixa à esquerda (240px): wordmark Nouè no topo, nav vertical (Visão geral · Top 30 · Roteiros ·
  Config), rodapé "TikTok Shop · últimos 30 dias". Item ativo = superfície-2 + ink primário (sem barra colorida).
- **Conteúdo:** `max-width: 1200px`, centralizado, padding 32px (16px no mobile). Cabeçalho da página = título
  (serifada) + descrição (muted) à esquerda, **ação principal** à direita.
- **Mobile:** sidebar vira topbar; grids colapsam para 1 coluna; tabela com `overflow-x:auto` no próprio container
  (o body nunca rola lateralmente).
- Toggle de tema (claro/escuro) no rodapé da sidebar.

---

## 8. Componentes (specs)

- **Botão primário:** fill acento, texto branco, raio 10px, 14px semibold, hover → acento pressed. Loading = "Processando…".
- **Botão fantasma:** superfície-2 + borda hairline + ink; hover → ink primário.
- **Stat tile (KPI):** label uppercase muted; valor grande `tabular-nums`; sub-linha opcional (contexto: "9 tier1 · 7 tier2");
  delta opcional (seta ↑/↓ + %) na cor de status (verde/vermelho) **com** o sinal, nunca cor sozinha; sparkline opcional
  (área tênue, endpoint destacado). O tile de GMV total leva o acento no valor.
- **Badge de tier (pill):** cor de status + rótulo textual ("Tier 1 · meta"/"Tier 2 · fallback"/"Abaixo da meta") —
  cor + palavra, nunca só cor.
- **Badge de status:** idem (Analisado=good, Falhou=critical, em progresso=info/azul).
- **Chip:** superfície-2 + borda; usado para ganchos, gatilhos, temas.
- **Linha da tabela Top 30:** rank em chip numérico → criador (@handle) + legenda truncada → **GMV com barra-na-célula**
  (barra sequencial fina atrás/junto do número, ponta arredondada 4px, ancorada à esquerda, magnitude relativa ao #1) →
  tier (pill) → pedidos · conversão · views (`tabular-nums`) → status. Linha inteira clicável (hover = superfície-2).
- **Card de roteiro:** título (serifada leve) + ângulo (muted) + duração (chip) + **Copiar**. Modo `human`: gancho, corpo
  com marcações de tempo (`pre` em superfície-2), CTA, e **shot list** em mini-tabela (Cena/Ação/Texto na tela). Modo `ai`:
  bloco "PROMPT PARA IA" em mono, monospace, botão copiar.
- **Estado vazio:** headline na serifada + 1 linha muted + ação. Nunca um bloco cinza sem hierarquia.
- **Empty/loading/erro:** sempre desenhados (skeleton com superfície-2; erro em `critical` com o que fazer).

---

## 9. Telas (5)

1. **Visão geral** — Row de 4 stat tiles (GMV Top 30 [acento], Vídeos [+mix de tiers], Pedidos, Ticket médio [+conv.]).
   Abaixo: **Playbook dos 30 dias** — resumo, "Estrutura vencedora" (card destacado), ganchos recorrentes (chips),
   e 3 colunas: Temas · Recomendações · Evitar. Ação no topo: "Reprocessar 30 dias". Opcional: mini-gráfico
   **"mix de tiers"** = barra segmentada horizontal (good/warning/neutro) com rótulos, **não pizza**.
2. **Top 30** — tabela de ranking (componente acima). Filtro por tier em uma linha acima da tabela. Barra-na-célula de GMV.
3. **Detalhe do vídeo** — cabeçalho (@criador, tier, #rank, status, legenda, data) + **Baixar vídeo** e "Abrir no TikTok".
   Row de 5 métricas. **Análise de IA**: 4 blocos (Pontos fortes · Replicar · Copiar · Evitar) + gancho, estrutura,
   gatilhos (chips). **Transcrição** em card. Player/thumbnail à esquerda quando houver mídia.
4. **Roteiros** — duas seções: "Para pessoa real gravar" (cards `human`) e "Para replicar com IA" (cards `ai`).
   Ação: "Gerar novos roteiros".
5. **Configurações** — form de critérios (Top N, ranquear por, Tier1/Tier2 GMV, janela, moeda), import de CSV, ações.

---

## 10. Regras de data-viz (resumo do método)

1. **Escolha a forma pela função do dado:** magnitude→barra; identidade→categórica; um número→stat tile;
   parte-do-todo (3 tiers)→barra segmentada (não pizza); mudança no tempo→linha.
2. **Cor por último**, pela função (categórica/sequencial/status). Ordem categórica fixa (seção 4).
3. **Marcas finas**, ponta de dado arredondada 4px ancorada à base, linhas 2px, gap de 2px entre fills.
4. **Hover por padrão:** tooltip por marca em barra/ponto; crosshair+tooltip em linha/área.
5. **Legenda** sempre p/ ≥2 séries (rótulo direto ≤4); texto sempre em ink (nunca na cor da série).
6. **Acessibilidade:** table view disponível; escuro é uma paleta *própria* (seção 4), não flip automático;
   status sempre com ícone+rótulo.

---

## 11. Movimento & interação

- Sutil e funcional: transições 120–200ms em hover/estado; `prefers-reduced-motion` respeitado.
- O que é interativo **parece** interativo (linha da tabela, botões, chips copiáveis). Foco de teclado visível.
- Nada de animação decorativa que "cheira a IA".

---

## 12. Temas & acessibilidade

- Renderizar no tema do viewer: `prefers-color-scheme` + override por `data-theme` (toggle) nos dois sentidos.
- Definir a paleta como **CSS custom properties** no `:root`; redefinir só os tokens no dark. Estilizar via tokens.
- Contraste AA em texto; foco visível; alvos de toque ≥ 40px; `tabular-nums` onde dígitos alinham.

---

## 13. Voz & copy (PT-BR)

- Direta, do lado do usuário. Botão diz o que faz ("Reprocessar 30 dias" → toast "Reprocessado").
- Nomear pelo que a pessoa reconhece ("vídeos que mais venderam", não "registros de métrica").
- Erros dizem o que houve e o que fazer, sem desculpa. Números com locale pt-BR (R$, 1.234,56).

---

## 14. Do / Don't

**Do:** neutro quente escolhido; 1 acento framboesa; status reservado; serifada com restrição; barra-na-célula;
estados desenhados; paleta de gráfico validada.
**Don't:** gradiente roxo→azul; emoji como marcador de seção; tudo centralizado; `rounded-lg` universal; barra de
acento na lateral de card; Inter/Space Grotesk default; pizza para tiers; eixo duplo; cor de status virando série.

---

## 15. Prompt pronto pra colar (gera um mockup no Claude)

```
Crie um mockup de dashboard (HTML+CSS inline, responsivo, tema claro/escuro via prefers-color-scheme
e data-theme) para o "Nouè · UGC Dashboard": painel de marca de beleza que mostra os Top 30 vídeos de
criadores (UGC) que mais venderam no TikTok Shop, com análise de IA e roteiros.

Direção: "editorial beauty meets data terminal" — base neutra quente (viés rosé), UM acento framboesa,
dados precisos e calmos. Sem gradiente roxo-azul, sem emoji de seção, sem rounded-lg em tudo.

Tokens (claro / escuro):
- bg #F7F3F1 / #0F0C10 · card #FFFFFF / #17141A · card2 #F3EDEB / #221D26 · borda #E7DEDA / #2E2833
- ink #1A1416 / #F5F1F3 · secundário #6B5F62 / #B9AEB4 · muted #9A8E90 / #8A7F86
- acento #D6336C / #E85D8A (hover #B4185B) · acento-wash #FBEAF1 / #2A1620
- status (fixo): good #0CA30C · warning #FAB219 · critical #D03B3B (sempre com rótulo, nunca cor só)
- gráfico categórico (ordem fixa): #2A78D6 #1BAF7A #EDA100 #008300 #4A3AA7 #E34948

Tipografia: display serifada "Fraunces" (títulos e wordmark, com restrição) + UI "Hanken Grotesk";
números com tabular-nums; KPI grandes no sans, não na serifada. Raios: card 14px, botão 10px, pill 999px.
Elevação por hairline border, não sombra pesada. O acento aparece em UM lugar por tela.

Telas: (1) Visão geral com 4 stat tiles (GMV Top 30 em acento, Vídeos com mix de tiers, Pedidos, Ticket médio)
e um "Playbook dos 30 dias" (resumo, estrutura vencedora, ganchos como chips, e 3 colunas Temas/Recomendações/
Evitar); (2) Top 30 = tabela de ranking com rank em chip, @criador+legenda, GMV com barra-na-célula (sequencial,
ponta arredondada 4px), pill de tier (Tier 1·meta / Tier 2·fallback / Abaixo da meta), pedidos/conversão/views,
status; (3) Detalhe do vídeo com métricas, análise de IA em 4 blocos (Pontos fortes/Replicar/Copiar/Evitar) +
gancho/estrutura/gatilhos, transcrição, botão Baixar; (4) Roteiros em duas colunas (pessoa real / IA) com cards;
(5) Config com form de critérios. Sidebar fixa (Nouè, Visão geral, Top 30, Roteiros, Config).

Use dados de exemplo plausíveis em PT-BR (criadores tipo @manu.beauty, GMV em R$, tiers). Estados vazio/hover
desenhados. Acessível (AA, foco visível, tabular-nums). Comece pela tela "Visão geral".
```

---

### Tokens ↔ código atual
Ao implementar no `apps/web`, estes tokens substituem as variáveis em `app/globals.css`
(`--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-brand`, `--color-muted`)
e as classes `.card`/`.card-2`/`.gradient-brand`. Os componentes em `components/ui.tsx` (StatCard, TierBadge,
StatusBadge, Chip) já mapeiam 1:1 com a seção 8.
