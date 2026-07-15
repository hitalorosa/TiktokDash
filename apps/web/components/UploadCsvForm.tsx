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
    const input = (e.currentTarget.elements.namedItem("file") as HTMLInputElement) || null;
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
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-2 file:text-sm file:text-white hover:file:opacity-90"
      />
      <button
        type="submit"
        disabled={loading}
        className="gradient-brand inline-flex w-fit items-center rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Importando…" : "Importar CSV"}
      </button>

      {result && (
        <div className="card-2 p-3 text-sm">
          {result.error ? (
            <span className="text-red-300">Erro: {result.error}</span>
          ) : (
            <div className="space-y-1">
              <div>
                ✓ Importados: <b>{result.imported ?? 0}</b> · ignorados: {result.skipped ?? 0}
              </div>
              {result.unmappedHeaders && result.unmappedHeaders.length > 0 && (
                <div className="muted">
                  Colunas não mapeadas: {result.unmappedHeaders.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
