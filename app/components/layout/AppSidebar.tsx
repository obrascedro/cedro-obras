"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import UserMenu from "@/app/components/auth/UserMenu";
import CedroLogo from "@/app/components/brand/CedroLogo";
import NavIcon from "@/app/components/layout/NavIcon";
import {
  isNavItemActive,
  NAV_SECTIONS,
} from "@/app/components/layout/nav-config";
import { APP_SHORT_NAME } from "@/lib/brand";

type AppSidebarProps = {
  nomeUsuario?: string;
  notasPendentes: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export default function AppSidebar({
  nomeUsuario,
  notasPendentes,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[var(--cedro-surface)]">
      <div
        className={`flex items-center border-b border-[var(--cedro-border)] px-4 py-5 ${
          collapsed ? "justify-center px-2" : "justify-center"
        }`}
      >
        {collapsed ? (
          <span
            className="text-sm font-bold text-[var(--cedro-brown)]"
            title="Cedro Projetos e Construções"
          >
            {APP_SHORT_NAME}
          </span>
        ) : (
          <CedroLogo variant="sidebar" href="/dashboard" className="mx-auto" />
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Principal">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <p className="cedro-nav-section-title">{section.title}</p>
            ) : null}
            <ul className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item);
                const showBadge =
                  item.href === "/financeiro/notas-fiscais" && notasPendentes > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`cedro-nav-link ${active ? "cedro-nav-link-active" : ""} ${
                        collapsed ? "justify-center px-2" : ""
                      }`}
                    >
                      <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                      {!collapsed ? (
                        <span className="flex flex-1 items-center justify-between gap-2">
                          <span>{item.label}</span>
                          {showBadge ? (
                            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--cedro-orange)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {notasPendentes > 99 ? "99+" : notasPendentes}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--cedro-border)] p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mb-2 hidden w-full rounded-lg p-2 text-xs text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)] lg:block"
            aria-label="Expandir menu"
          >
            →
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mb-3 hidden w-full rounded-lg px-2 py-1.5 text-left text-xs text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)] lg:block"
            aria-label="Recolher menu"
          >
            ← Recolher menu
          </button>
        )}

        <UserMenu
          nomeUsuario={nomeUsuario}
          variant="sidebar"
          collapsed={collapsed}
        />
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Fechar menu"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--cedro-border)] transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[var(--cedro-sidebar-collapsed)]" : "w-[var(--cedro-sidebar-width)]"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
