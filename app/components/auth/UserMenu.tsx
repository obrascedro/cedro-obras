"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type UserMenuProps = {
  nomeUsuario?: string;
  variant?: "sidebar" | "header";
  perfilHref?: string;
  collapsed?: boolean;
};

function userInitials(nome?: string): string {
  if (!nome) return "?";
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function UserMenu({
  nomeUsuario,
  variant = "header",
  perfilHref = "/admin/funcionarios",
  collapsed = false,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setOpen(false);

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();

    try {
      await logoutAction();
    } catch {
      window.location.href = "/login";
    }
  }

  const isSidebar = variant === "sidebar";
  const showInlineName = isSidebar && !collapsed && nomeUsuario;

  return (
    <div
      ref={menuRef}
      className={`relative ${isSidebar ? "w-full" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={nomeUsuario ? `Menu de ${nomeUsuario}` : "Menu do usuário"}
        className={`flex items-center rounded-xl text-left transition-colors hover:bg-[var(--cedro-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cedro-teal)] focus-visible:ring-offset-2 ${
          isSidebar
            ? `w-full gap-3 px-3 py-2.5 ${collapsed ? "justify-center px-2" : "bg-[var(--cedro-bg)]"}`
            : "gap-2 rounded-lg p-1"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cedro-brown)] text-sm font-semibold text-white">
          {userInitials(nomeUsuario)}
        </div>
        {showInlineName ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--cedro-text)]">
              {nomeUsuario}
            </p>
          </div>
        ) : null}
        {!isSidebar && nomeUsuario ? (
          <span className="hidden max-w-[140px] truncate text-sm text-[var(--cedro-text-muted)] sm:inline">
            {nomeUsuario}
          </span>
        ) : null}
        {!collapsed ? (
          <svg
            className={`h-4 w-4 shrink-0 text-[var(--cedro-text-muted)] transition-transform ${
              open ? "rotate-180" : ""
            } ${isSidebar ? "ml-auto" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute z-50 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--cedro-border)] bg-[var(--cedro-surface)] py-1 shadow-[var(--cedro-shadow-md)] ${
            isSidebar
              ? "bottom-full left-0 mb-2 w-full"
              : "right-0 top-full mt-2"
          }`}
        >
          {nomeUsuario ? (
            <div className="border-b border-[var(--cedro-border)] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[var(--cedro-text)]">
                {nomeUsuario}
              </p>
            </div>
          ) : null}

          <Link
            href={perfilHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-4 py-2.5 text-sm text-[var(--cedro-text)] transition-colors hover:bg-[var(--cedro-bg)]"
          >
            Perfil
          </Link>

          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={handleSignOut}
            className="flex w-full items-center px-4 py-2.5 text-left text-sm text-[var(--cedro-danger,#b42318)] transition-colors hover:bg-[rgb(180_35_24/0.06)] disabled:opacity-60"
          >
            {signingOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
