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
  const v = n * 100;
  // mais casas quando muito pequeno (ex.: conversão por impressão)
  const digits = v !== 0 && Math.abs(v) < 1 ? 2 : 1;
  return `${v.toFixed(digits)}%`;
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
