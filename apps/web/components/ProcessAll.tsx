"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(url: string) {
  const res = await fetch(url, { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((data.error as string) || `HTTP ${res.status}`);
  return data;
}

/** Repete em caso de limite de taxa (free tier ~15/min). */
async function postWithRetry(url: string, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return data;
    const msg = (data.error as string) || `HTTP ${res.status}`;
    if (/429|quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(msg) && i < tries - 1) {
      await sleep(35000);
      continue;
    }
    throw new Error(msg);
  }
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
      for (let guard = 0; guard < 400; guard++) {
        const r = await post("/api/analyze-batch");
        done += (r.analyzed as number) || 0;
        if (r.done || ((r.remaining as number) ?? 0) <= 0) break;
        if (r.rateLimited) {
          const w = ((r.retryAfterMs as number) || 30000) + 1500;
          setStep(`Analisados ${done}. Limite grátis atingido — aguardando ${Math.round(w / 1000)}s…`);
          await sleep(w);
        } else {
          setStep(`Analisando com IA… ${done}/${(r.total as number) ?? "?"}`);
          await sleep(1200);
        }
      }

      setStep(`Analisados ${done}. Gerando playbook…`);
      await postWithRetry("/api/aggregate");

      setStep("Gerando roteiros…");
      await postWithRetry("/api/scripts/generate");

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
        <span style={{ fontSize: 11, color: error ? "var(--crit)" : "var(--muted)", maxWidth: 300 }}>
          {step}
        </span>
      )}
    </span>
  );
}
