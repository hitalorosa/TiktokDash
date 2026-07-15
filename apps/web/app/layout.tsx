import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nouê · UGC Dashboard",
  description: "Top 30 UGC do TikTok Shop, transcrição, análise de IA e geração de roteiros.",
};

const NAV = [
  { href: "/", label: "Visão geral" },
  { href: "/videos", label: "Top 30" },
  { href: "/roteiros", label: "Roteiros" },
  { href: "/config", label: "Config" },
];

const NO_FLASH = `try{var t=localStorage.getItem('noue-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>
        <div className="app">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-name">Nouê</span>
              <span className="brand-sub">UGC</span>
            </div>
            <nav className="navwrap">
              {NAV.map((n) => (
                <NavLink key={n.href} href={n.href} label={n.label} />
              ))}
            </nav>
            <div className="navfoot">
              <ThemeToggle />
              <div className="account">
                <span className="avatar">N</span>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)" }}>
                    Time Nouê
                  </div>
                  <div style={{ fontSize: "11px" }} className="muted">
                    TikTok Shop · BR
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
