"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function systemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("noue-theme") as Theme | null) ?? null;
    setTheme(stored ?? systemTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("noue-theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button className="theme-btn" onClick={toggle} aria-label="Alternar tema">
      <span>Tema</span>
      <span style={{ fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
        {mounted ? (theme === "dark" ? "Escuro" : "Claro") : ""}
      </span>
    </button>
  );
}
