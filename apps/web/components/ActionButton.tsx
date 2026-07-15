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

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button
        onClick={run}
        disabled={loading}
        className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost ink"}`}
      >
        {loading ? "Processando…" : children}
      </button>
      {msg && (
        <span style={{ fontSize: 11, color: error ? "var(--crit)" : "var(--muted)", maxWidth: 240 }}>
          {msg}
        </span>
      )}
    </span>
  );
}
