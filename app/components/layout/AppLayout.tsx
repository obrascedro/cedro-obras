"use client";

import { useState } from "react";
import AppHeader from "@/app/components/layout/AppHeader";
import AppSidebar from "@/app/components/layout/AppSidebar";
import CedroLogo from "@/app/components/brand/CedroLogo";

type AppLayoutProps = {
  children: React.ReactNode;
  nomeUsuario?: string;
  notasPendentes: number;
  pageTitle?: string;
};

export default function AppLayout({
  children,
  nomeUsuario,
  notasPendentes,
  pageTitle,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--cedro-bg)]">
      <AppSidebar
        nomeUsuario={nomeUsuario}
        notasPendentes={notasPendentes}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--cedro-border)] bg-[var(--cedro-surface)] px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-[var(--cedro-text-muted)]"
              aria-label="Abrir menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <CedroLogo variant="header" href="/dashboard" />
            <div className="w-10" aria-hidden />
          </header>
        </div>

        <div className="hidden lg:block">
          <AppHeader
            pageTitle={pageTitle}
            nomeUsuario={nomeUsuario}
            notasPendentes={notasPendentes}
            onOpenMenu={() => setMobileOpen(true)}
          />
        </div>

        {children}
      </div>
    </div>
  );
}
