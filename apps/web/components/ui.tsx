import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow" style={{ marginBottom: 8 }}>{children}</div>;
}

export function PageHead({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="page-title">{title}</h1>
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

const TIER = {
  tier1: { cls: "pill t1", label: "Tier 1 · meta" },
  tier2: { cls: "pill t2", label: "Tier 2 · fallback" },
  below: { cls: "pill below", label: "Abaixo da meta" },
} as const;

export function TierPill({ tier }: { tier?: string | null }) {
  if (!tier || !(tier in TIER)) return <span className="muted" style={{ fontSize: 11 }}>—</span>;
  const t = TIER[tier as keyof typeof TIER];
  return <span className={t.cls}>{t.label}</span>;
}

const STATUS: Record<string, { color: string; label: string }> = {
  analyzed: { color: "var(--good)", label: "Analisado" },
  failed: { color: "var(--crit)", label: "Falhou" },
  discovered: { color: "var(--muted)", label: "Descoberto" },
  downloading: { color: "var(--warn)", label: "Processando" },
  downloaded: { color: "var(--warn)", label: "Processando" },
  transcribing: { color: "var(--warn)", label: "Processando" },
  transcribed: { color: "var(--warn)", label: "Processando" },
  analyzing: { color: "var(--warn)", label: "Processando" },
};

export function StatusDot({ status, align = "right" }: { status?: string | null; align?: "left" | "right" }) {
  const s = (status && STATUS[status]) || STATUS.discovered;
  return (
    <span
      style={{
        display: "inline-flex",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: s.color,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color }} />
      {s.label}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      className="card"
      style={{
        padding: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        textAlign: "center",
      }}
    >
      <div className="display" style={{ fontSize: 18 }}>{title}</div>
      <div className="muted" style={{ fontSize: 14, maxWidth: 460 }}>{children}</div>
    </div>
  );
}

/** Divide uma "estrutura vencedora" (texto com →) em passos numerados. */
export function splitSteps(text?: string | null): { n: string; t: string }[] {
  if (!text) return [];
  return text
    .split(/→|->|→/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t, i) => ({ n: String(i + 1).padStart(2, "0"), t }));
}
