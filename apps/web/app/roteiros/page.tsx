import { getScripts } from "@/lib/data";
import { PageHead, EmptyState } from "@/components/ui";
import { GenerateCard } from "@/components/GenerateCard";

export const dynamic = "force-dynamic";

type ScriptRow = Awaited<ReturnType<typeof getScripts>>[number];

function dur(sec?: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusPill(status: string) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    padding: "3px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
  };
  if (status === "approved")
    return { label: "Aprovado", style: { ...base, background: "color-mix(in oklab,var(--good) 14%,transparent)", color: "var(--good)" } };
  if (status === "archived")
    return { label: "Arquivado", style: { ...base, background: "var(--card2)", color: "var(--muted)", border: "1px solid var(--border)" } };
  return { label: "Rascunho", style: { ...base, background: "var(--card2)", color: "var(--muted)", border: "1px solid var(--border)" } };
}

function ScriptCard({ s }: { s: ScriptRow }) {
  const st = statusPill(s.status);
  const author = s.mode === "ai" ? "Nouê IA" : s.angle ?? "roteiro";
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{s.title}</div>
        <span style={st.style}>{st.label}</span>
      </div>
      {s.hook && (
        <div className="sec" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{s.hook}</div>
      )}
      <div className="tnum" style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--muted)" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author}</span>
        <span>·</span>
        <span>{dur(s.durationSec)}</span>
      </div>
    </div>
  );
}

export default async function RoteirosPage() {
  const scripts = await getScripts();
  const human = scripts.filter((s) => s.mode === "human");
  const ai = scripts.filter((s) => s.mode === "ai");

  return (
    <>
      <PageHead eyebrow="Roteiros" title="Biblioteca de roteiros" />

      {scripts.length === 0 ? (
        <EmptyState title="Nenhum roteiro ainda">
          Gere o playbook dos 30 dias e clique em “Gerar roteiros”, ou rode{" "}
          <code>npm run db:seed</code> para ver exemplos.
        </EmptyState>
      ) : (
        <div className="roteiros-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <h2 className="display" style={{ fontSize: 18, margin: 0 }}>Pessoa real</h2>
              <span className="muted tnum" style={{ fontSize: 12 }}>{human.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {human.map((s) => <ScriptCard key={s.id} s={s} />)}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <h2 className="display" style={{ fontSize: 18, margin: 0 }}>IA</h2>
              <span className="muted tnum" style={{ fontSize: 12 }}>{ai.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ai.map((s) => <ScriptCard key={s.id} s={s} />)}
              <GenerateCard />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
