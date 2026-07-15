import type { Metadata } from "next";
import "./globals.css";
import { NavLink } from "@/components/NavLink";

export const metadata: Metadata = {
  title: "Nouè · UGC Dashboard",
  description: "Top 30 UGC do TikTok Shop, transcrição, análise de IA e geração de roteiros.",
};

const NAV = [
  { href: "/", label: "Visão geral", icon: "📊" },
  { href: "/videos", label: "Top 30", icon: "🎬" },
  { href: "/roteiros", label: "Roteiros", icon: "📝" },
  { href: "/config", label: "Configurações", icon: "⚙️" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex">
            <div className="mb-6 flex items-center gap-2 px-2">
              <div className="gradient-brand flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-white">
                N
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Nouè</div>
                <div className="text-xs muted leading-tight">UGC Dashboard</div>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <NavLink key={n.href} {...n} />
              ))}
            </nav>
            <div className="mt-auto px-2 pt-6 text-xs muted">
              TikTok Shop · últimos 30 dias
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* topbar mobile */}
            <header className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden">
              <div className="gradient-brand flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white">
                N
              </div>
              <span className="font-semibold">Nouè UGC</span>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
