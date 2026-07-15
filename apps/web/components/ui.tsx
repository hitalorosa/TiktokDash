import type { ReactNode } from "react";
import { TIER_LABEL, STATUS_LABEL } from "@/lib/format";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide muted">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent ? "text-[var(--color-brand)]" : ""}`}>
        {value}
      </div>
      {sub != null && <div className="mt-1 text-sm muted">{sub}</div>}
    </div>
  );
}

export function TierBadge({ tier }: { tier?: string | null }) {
  if (!tier) return <span className="muted text-xs">—</span>;
  const styles: Record<string, string> = {
    tier1: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    tier2: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    below: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[tier] ?? styles.below}`}
    >
      {TIER_LABEL[tier] ?? tier}
    </span>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const done = status === "analyzed";
  const failed = status === "failed";
  const cls = failed
    ? "bg-red-500/15 text-red-300 border-red-500/30"
    : done
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-sm">
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {desc && <p className="mt-1 text-sm muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="text-lg font-medium">{title}</div>
      <div className="max-w-md text-sm muted">{children}</div>
    </div>
  );
}

export function ListBlock({ title, items, icon }: { title: string; items: string[]; icon?: string }) {
  return (
    <div className="card-2 p-4">
      <div className="mb-2 text-sm font-semibold">
        {icon && <span className="mr-1">{icon}</span>}
        {title}
      </div>
      {items.length ? (
        <ul className="space-y-1.5 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="muted">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm muted">—</div>
      )}
    </div>
  );
}
