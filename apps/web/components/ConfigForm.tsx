"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConfigShape {
  topN: number;
  rankBy: string;
  tier1Gmv: number;
  tier2Gmv: number;
  windowDays: number;
  currency: string;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-2)]";

export function ConfigForm({ initial }: { initial: ConfigShape }) {
  const [cfg, setCfg] = useState<ConfigShape>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof ConfigShape>(k: K, v: ConfigShape[K]) {
    setCfg((c) => ({ ...c, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao salvar");
      setMsg("Salvo ✓");
      router.refresh();
    } catch (e) {
      setMsg("Erro: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Top N vídeos" hint="Quantos vídeos selecionar (padrão 30)">
        <input
          type="number"
          className={inputCls}
          value={cfg.topN}
          onChange={(e) => set("topN", Number(e.target.value))}
        />
      </Field>
      <Field label="Ranquear por">
        <select className={inputCls} value={cfg.rankBy} onChange={(e) => set("rankBy", e.target.value)}>
          <option value="gmv">GMV</option>
          <option value="orders">Pedidos</option>
          <option value="roas">ROAS (se houver anúncio)</option>
        </select>
      </Field>
      <Field label="Tier 1 · GMV mínimo" hint="Meta principal">
        <input
          type="number"
          className={inputCls}
          value={cfg.tier1Gmv}
          onChange={(e) => set("tier1Gmv", Number(e.target.value))}
        />
      </Field>
      <Field label="Tier 2 · GMV mínimo" hint="Fallback">
        <input
          type="number"
          className={inputCls}
          value={cfg.tier2Gmv}
          onChange={(e) => set("tier2Gmv", Number(e.target.value))}
        />
      </Field>
      <Field label="Janela (dias)">
        <input
          type="number"
          className={inputCls}
          value={cfg.windowDays}
          onChange={(e) => set("windowDays", Number(e.target.value))}
        />
      </Field>
      <Field label="Moeda">
        <select
          className={inputCls}
          value={cfg.currency}
          onChange={(e) => set("currency", e.target.value)}
        >
          <option value="BRL">BRL (R$)</option>
          <option value="USD">USD ($)</option>
        </select>
      </Field>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="gradient-brand inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
        {msg && <span className="text-sm muted">{msg}</span>}
      </div>
    </div>
  );
}
