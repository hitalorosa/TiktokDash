"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadResult {
  imported?: number;
  skipped?: number;
  unmappedHeaders?: string[];
  message?: string;
  error?: string;
}

export function UploadCsvForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const content = await file.text();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, content }),
      });
      const data = (await res.json().catch(() => ({}))) as UploadResult;
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      router.refresh();
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        style={{ fontSize: 13, color: "var(--sec)" }}
      />
      <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "fit-content" }}>
        {loading ? "Importando…" : "Importar CSV"}
      </button>

      {result && (
        <div className="card2" style={{ padding: 12, fontSize: 13 }}>
          {result.error ? (
            <span style={{ color: "var(--crit)" }}>Erro: {result.error}</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div>
                ✓ Importados <b>{result.imported ?? 0}</b> · ignorados {result.skipped ?? 0}
              </div>
              {result.unmappedHeaders && result.unmappedHeaders.length > 0 && (
                <div className="muted">Colunas não mapeadas: {result.unmappedHeaders.join(", ")}</div>
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
