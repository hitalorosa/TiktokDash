"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} className={`nav-item${active ? " active" : ""}`}>
      <span className="nav-dot" />
      <span>{label}</span>
    </Link>
  );
}
