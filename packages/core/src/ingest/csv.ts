import Papa from "papaparse";
import type { NormalizedVideoRow } from "../types";

/** Aliases de cabeçalho (PT/EN) → campo normalizado. Comparação sem acento/caixa. */
const HEADER_ALIASES: Record<keyof AliasTargets, string[]> = {
  tiktokVideoId: ["video id", "id do video", "video_id", "content id", "id do conteudo", "post id"],
  url: ["video url", "url", "link", "link do video", "video link", "url do video"],
  creatorHandle: [
    "creator", "username", "criador", "handle", "creator username", "nome de usuario", "usuario",
    "nome do criador", "creator name",
  ],
  creatorName: ["nickname", "apelido"],
  caption: [
    "caption", "legenda", "title", "titulo", "descricao", "description",
    "nome do video", "video title",
  ],
  postedAt: [
    "post time", "posted", "data", "data de publicacao", "create time", "publicado em", "date",
    "data de publicacao do video",
  ],
  gmv: [
    "gmv", "receita", "revenue", "vendas", "sales amount", "faturamento", "valor de vendas", "gmv (bruto)",
    "valor bruto da mercadoria gmv",
  ],
  orders: [
    "orders", "pedidos", "qtd pedidos", "order count", "numero de pedidos",
    "pedidos de afiliados",
  ],
  unitsSold: [
    "units", "unidades", "unidades vendidas", "items sold", "quantidade", "itens vendidos",
    "itens vendidos de afiliados",
  ],
  productClicks: ["clicks", "cliques", "product clicks", "cliques no produto"],
  views: [
    "views", "visualizacoes", "video views", "impressoes", "impressions",
    "impressoes de videos com produtos a venda",
  ],
  commission: [
    "commission", "comissao", "est. commission", "comissao estimada", "est commission",
  ],
  roas: ["roas"],
  productId: ["product id", "produto", "sku", "product", "id do produto"],
};

/** Extrai o @handle de uma URL do TikTok. */
export function handleFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/@([A-Za-z0-9._]+)/);
  return m?.[1];
}

/** Extrai o ID do vídeo de uma URL do TikTok (…/video/<id>). */
export function videoIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/\/video\/(\d+)/);
  return m?.[1];
}

interface AliasTargets {
  tiktokVideoId: string;
  url: string;
  creatorHandle: string;
  creatorName: string;
  caption: string;
  postedAt: string;
  gmv: string;
  orders: string;
  unitsSold: string;
  productClicks: string;
  views: string;
  commission: string;
  roas: string;
  productId: string;
}

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Converte string numérica (formatos BR "1.234,56" e US "1,234.56") em number. */
export function toNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  let s = String(value).trim();
  if (!s) return undefined;
  // remove símbolos de moeda e espaços
  s = s.replace(/[R$\s %]/gi, "").replace(/[^\d.,-]/g, "");
  if (!s) return undefined;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // o último separador é o decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", "."); // BR
    } else {
      s = s.replace(/,/g, ""); // US
    }
  } else if (hasComma) {
    // vírgula sozinha: se parece decimal (<=2 casas), vira ponto; senão milhar
    const parts = s.split(",");
    if (parts.length === 2 && parts[1]!.length <= 2) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(value: unknown): Date | undefined {
  if (value == null || value === "") return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Mapeia os cabeçalhos reais do CSV para os campos conhecidos. */
function buildColumnMap(headers: string[]): Partial<Record<keyof AliasTargets, string>> {
  const map: Partial<Record<keyof AliasTargets, string>> = {};
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  for (const field of Object.keys(HEADER_ALIASES) as (keyof AliasTargets)[]) {
    const aliases = HEADER_ALIASES[field];
    const found = normalized.find((h) => aliases.includes(h.norm));
    if (found) map[field] = found.raw;
  }
  return map;
}

export interface ParseResult {
  rows: NormalizedVideoRow[];
  columnMap: Partial<Record<keyof AliasTargets, string>>;
  unmappedHeaders: string[];
  skipped: number;
}

/**
 * Faz o parse de um CSV de export do Affiliate Center e devolve linhas normalizadas.
 * Ignora linhas sem GMV numérico.
 */
export function parseAffiliateCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const columnMap = buildColumnMap(headers);
  const mappedRaw = new Set(Object.values(columnMap));
  const unmappedHeaders = headers.filter((h) => !mappedRaw.has(h));

  const get = (row: Record<string, string>, field: keyof AliasTargets): string | undefined => {
    const col = columnMap[field];
    return col ? row[col] : undefined;
  };

  const rows: NormalizedVideoRow[] = [];
  let skipped = 0;

  for (const row of parsed.data) {
    const gmv = toNumber(get(row, "gmv"));
    if (gmv == null) {
      skipped++;
      continue;
    }
    const productId = get(row, "productId");
    const url = get(row, "url")?.trim() || undefined;
    let handle = get(row, "creatorHandle")?.trim()?.replace(/^@/, "");
    if (!handle) handle = handleFromUrl(url);
    const tiktokVideoId = get(row, "tiktokVideoId")?.trim() || videoIdFromUrl(url);
    rows.push({
      tiktokVideoId: tiktokVideoId || undefined,
      url,
      creatorHandle: handle || undefined,
      creatorName: get(row, "creatorName")?.trim() || undefined,
      caption: get(row, "caption")?.trim() || undefined,
      postedAt: toDate(get(row, "postedAt")),
      productIds: productId ? [productId.trim()] : [],
      gmv,
      orders: toNumber(get(row, "orders")),
      unitsSold: toNumber(get(row, "unitsSold")),
      productClicks: toNumber(get(row, "productClicks")),
      views: toNumber(get(row, "views")),
      commission: toNumber(get(row, "commission")),
      roas: toNumber(get(row, "roas")) ?? null,
      convRate: undefined,
      currency: undefined,
    });
  }

  // deriva convRate quando possível
  for (const r of rows) {
    if (r.convRate == null && r.orders != null) {
      if (r.productClicks) r.convRate = Number((r.orders / r.productClicks).toFixed(4));
      else if (r.views) r.convRate = Number((r.orders / r.views).toFixed(4));
    }
  }

  return { rows, columnMap, unmappedHeaders, skipped };
}
