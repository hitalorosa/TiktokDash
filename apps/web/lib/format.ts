export function money(n: number | null | undefined, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n ?? 0);
}

export function compactMoney(n: number | null | undefined, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n ?? 0);
}

export function num(n: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR").format(n ?? 0);
}

export function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function dateBR(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

export const TIER_LABEL: Record<string, string> = {
  tier1: "Tier 1 · meta",
  tier2: "Tier 2 · fallback",
  below: "Abaixo da meta",
};

export const STATUS_LABEL: Record<string, string> = {
  discovered: "Descoberto",
  downloading: "Baixando",
  downloaded: "Baixado",
  transcribing: "Transcrevendo",
  transcribed: "Transcrito",
  analyzing: "Analisando",
  analyzed: "Analisado",
  failed: "Falhou",
};
