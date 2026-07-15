"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateCard() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/scripts/generate", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg(data.message || "Enfileirado ✓");
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={loading}
      className="gen-card"
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 14,
        padding: "26px 20px",
        background: "transparent",
        textAlign: "center",
        color: "var(--muted)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 400, lineHeight: 1 }}>+</span>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>
        {loading ? "Enfileirando…" : "Gerar roteiro com IA"}
      </span>
      <span className="muted" style={{ fontSize: 12 }}>
        {msg ?? "a partir do playbook dos 30 dias"}
      </span>
    </button>
  );
}
