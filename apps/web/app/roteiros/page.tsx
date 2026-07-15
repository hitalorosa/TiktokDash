import { getScripts, getLatestReport } from "@/lib/data";
import { SectionHeading, EmptyState, Card, Chip } from "@/components/ui";
import { ActionButton } from "@/components/ActionButton";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

type ScriptRow = Awaited<ReturnType<typeof getScripts>>[number];

function humanCopyText(s: ScriptRow): string {
  return [
    `# ${s.title}`,
    s.angle ? `Ângulo: ${s.angle}` : "",
    s.hook ? `\nGancho: ${s.hook}` : "",
    s.body ? `\n${s.body}` : "",
    s.cta ? `\nCTA: ${s.cta}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function ShotList({ shotList }: { shotList: unknown }) {
  if (!Array.isArray(shotList) || shotList.length === 0) return null;
  return (
    <div className="card-2 mt-3 overflow-hidden p-0">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left muted">
            <th className="px-3 py-2 font-medium">Cena</th>
            <th className="px-3 py-2 font-medium">Ação</th>
            <th className="px-3 py-2 font-medium">Texto na tela</th>
          </tr>
        </thead>
        <tbody>
          {(shotList as { scene?: string; action?: string; onScreenText?: string }[]).map((sh, i) => (
            <tr key={i} className="border-b border-[var(--color-border)]/50">
              <td className="px-3 py-2">{sh.scene ?? "—"}</td>
              <td className="px-3 py-2">{sh.action ?? "—"}</td>
              <td className="px-3 py-2 muted">{sh.onScreenText ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScriptCard({ s }: { s: ScriptRow }) {
  const isAi = s.mode === "ai";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{s.title}</h3>
          {s.angle && <div className="mt-0.5 text-xs muted">{s.angle}</div>}
        </div>
        <div className="flex items-center gap-2">
          {s.durationSec && <Chip>{s.durationSec}s</Chip>}
          <CopyButton text={isAi ? s.aiPrompt ?? "" : humanCopyText(s)} />
        </div>
      </div>

      {isAi ? (
        <div className="mt-3">
          <div className="mb-1 text-xs font-semibold muted">PROMPT PARA IA</div>
          <pre className="card-2 whitespace-pre-wrap p-3 text-sm leading-relaxed">{s.aiPrompt}</pre>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {s.hook && (
            <p className="text-sm">
              <span className="font-semibold">Gancho:</span> {s.hook}
            </p>
          )}
          {s.body && <pre className="card-2 whitespace-pre-wrap p-3 text-sm leading-relaxed">{s.body}</pre>}
          {s.cta && (
            <p className="text-sm">
              <span className="font-semibold">CTA:</span> {s.cta}
            </p>
          )}
          <ShotList shotList={s.shotList} />
        </div>
      )}
    </Card>
  );
}

export default async function RoteirosPage() {
  const [scripts, report] = await Promise.all([getScripts(), getLatestReport()]);
  const human = scripts.filter((s) => s.mode === "human");
  const ai = scripts.filter((s) => s.mode === "ai");

  return (
    <>
      <SectionHeading
        title="Roteiros"
        desc="Gerados a partir do playbook dos 30 dias — para pessoas reais gravarem e para replicar com IA."
        action={
          report ? (
            <ActionButton endpoint="/api/scripts/generate">✨ Gerar novos roteiros</ActionButton>
          ) : undefined
        }
      />

      {scripts.length === 0 ? (
        <EmptyState title="Nenhum roteiro ainda">
          {report
            ? 'Clique em "Gerar novos roteiros" para criar roteiros a partir do playbook.'
            : "Gere primeiro a análise agregada dos 30 dias (ou rode npm run db:seed para ver exemplos)."}
        </EmptyState>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              🎥 Para pessoa real gravar <span className="text-sm muted">({human.length})</span>
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {human.map((s) => (
                <ScriptCard key={s.id} s={s} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              🤖 Para replicar com IA <span className="text-sm muted">({ai.length})</span>
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {ai.map((s) => (
                <ScriptCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
