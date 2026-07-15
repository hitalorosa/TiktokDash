"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(url: string) {
  const res = await fetch(url, { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((data.error as string) || `HTTP ${res.status}`);
  return data;
}

export function ProcessAll() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function run() {
    setRunning(true);
    setError(false);
    try {
      setStep("Reordenando Top 30…");
      await post("/api/reprocess");

      let done = 0;
      for (let guard = 0; guard < 300; guard++) {
        setStep(`Analisando com IA… ${done} vídeos`);
        const r = await post("/api/analyze-batch");
        done += (r.analyzed as number) || 0;
        if (r.done || ((r.remaining as number) ?? 0) <= 0 || (r.analyzed as number) === 0) break;
      }
      setStep(`Analisados ${done}. Gerando playbook…`);
      await post("/api/aggregate");

      setStep("Gerando roteiros…");
      await post("/api/scripts/generate");

      setStep("Concluído ✓");
      router.refresh();
    } catch (e) {
      setError(true);
      setStep((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button onClick={run} disabled={running} className="btn btn-primary">
        {running ? "Processando…" : "✨ Processar tudo (IA)"}
      </button>
      {step && (
        <span style={{ fontSize: 11, color: error ? "var(--crit)" : "var(--muted)", maxWidth: 280 }}>
          {step}
        </span>
      )}
    </span>
  );
}
