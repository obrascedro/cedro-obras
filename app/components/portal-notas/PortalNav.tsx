"use client";

import Link from "next/link";
import { FilePlus, FolderOpen, HardHat } from "lucide-react";

type PortalNavProps = {
  activePath: string;
  className?: string;
};

const items = [
  { href: "/portal/notas", label: "Enviar nota", icon: FilePlus },
  { href: "/portal/minhas-notas", label: "Minhas notas", icon: FolderOpen },
  {
    href: "/portal/acompanhamento",
    label: "Acompanhamento da obra",
    icon: HardHat,
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/portal/notas" && pathname.startsWith(href)) return true;
  return false;
}

export default function PortalNav({ activePath, className = "" }: PortalNavProps) {
  return (
    <nav
      className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-2 ${className}`.trim()}
      aria-label="Portal do funcionário"
    >
      {items.map((item) => {
        const ativo = isActive(activePath, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-3 text-xs font-semibold transition-all duration-150 sm:px-4 sm:text-sm ${
              ativo
                ? "bg-[var(--cedro-brown)] text-white shadow-[0_1px_3px_rgb(138_46_31/0.25)]"
                : "border border-[var(--cedro-border)] bg-white text-[var(--cedro-text-muted)] hover:border-[var(--cedro-border-strong)] hover:text-[var(--cedro-text)]"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
