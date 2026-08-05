"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type TabItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

type TabsProps = {
  items: TabItem[];
  activeHref: string;
  className?: string;
  ariaLabel?: string;
};

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/portal/notas" && pathname.startsWith(href)) return true;
  return false;
}

export default function Tabs({
  items,
  activeHref,
  className = "",
  ariaLabel = "Navegação",
}: TabsProps) {
  return (
    <nav
      className={`flex flex-col gap-3 sm:flex-row sm:gap-4 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const ativo = isActive(activeHref, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-150 sm:text-[0.9375rem] ${
              ativo
                ? "bg-[var(--cedro-brown)] text-white shadow-[var(--cedro-shadow-sm)]"
                : "border border-[var(--cedro-border)] bg-white text-[var(--cedro-text-muted)] hover:border-[var(--cedro-border-strong)] hover:text-[var(--cedro-text)]"
            }`}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={2} /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
