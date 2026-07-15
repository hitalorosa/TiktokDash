"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActionButton({
  endpoint,
  body,
  children,
  variant = "primary",
}: {
  endpoint: string;
  body?: unknown;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setMsg(null);
    setError(false);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg(data.message || "Feito ✓");
      router.refresh();
    } catch (e) {
      setError(true);
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "gradient-brand text-white hover:opacity-90"
      : "border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:text-white";

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={loading} className={`${base} ${styles}`}>
        {loading ? "Processando…" : children}
      </button>
      {msg && (
        <span className={`text-xs ${error ? "text-red-300" : "muted"}`}>{msg}</span>
      )}
    </div>
  );
}
