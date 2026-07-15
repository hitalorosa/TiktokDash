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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

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
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Falha ao salvar");
      setMsg("Salvo ✓");
      router.refresh();
    } catch (e) {
      setMsg("Erro: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ padding: "26px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Field label="Top N vídeos">
          <input
            className="input"
            type="number"
            value={cfg.topN}
            onChange={(e) => set("topN", Number(e.target.value))}
          />
        </Field>
        <Field label="Ranquear por">
          <select className="input" value={cfg.rankBy} onChange={(e) => set("rankBy", e.target.value)}>
            <option value="gmv">GMV</option>
            <option value="orders">Pedidos</option>
            <option value="roas">ROAS (se houver anúncio)</option>
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        <Field label="Tier 1 · GMV mín.">
          <input
            className="input"
            type="number"
            value={cfg.tier1Gmv}
            onChange={(e) => set("tier1Gmv", Number(e.target.value))}
          />
        </Field>
        <Field label="Tier 2 · GMV mín.">
          <input
            className="input"
            type="number"
            value={cfg.tier2Gmv}
            onChange={(e) => set("tier2Gmv", Number(e.target.value))}
          />
        </Field>
        <Field label="Janela (dias)">
          <input
            className="input"
            type="number"
            value={cfg.windowDays}
            onChange={(e) => set("windowDays", Number(e.target.value))}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Field label="Moeda">
          <select className="input" value={cfg.currency} onChange={(e) => set("currency", e.target.value)}>
            <option value="BRL">BRL (R$)</option>
            <option value="USD">USD ($)</option>
          </select>
        </Field>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          borderTop: "1px solid var(--border)",
          paddingTop: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--good)" }} />
          <span className="sec" style={{ fontSize: 13 }}>
            {msg ?? `Top ${cfg.topN} por ${cfg.rankBy.toUpperCase()} · ${cfg.windowDays} dias`}
          </span>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Salvando…" : "Salvar critérios"}
        </button>
      </div>
    </div>
  );
}
