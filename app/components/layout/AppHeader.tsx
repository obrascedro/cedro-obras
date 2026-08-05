import Link from "next/link";
import UserMenu from "@/app/components/auth/UserMenu";

type AppHeaderProps = {
  pageTitle?: string;
  nomeUsuario?: string;
  notasPendentes: number;
  onOpenMenu: () => void;
};

export default function AppHeader({
  pageTitle,
  nomeUsuario,
  notasPendentes,
  onOpenMenu,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--cedro-border)] bg-[var(--cedro-surface)]">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-lg p-2 text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)] lg:hidden"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {pageTitle ? (
            <h1 className="truncate text-lg font-semibold text-[var(--cedro-text)] lg:text-xl">
              {pageTitle}
            </h1>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {notasPendentes > 0 ? (
            <Link
              href="/financeiro/notas-fiscais"
              className="relative rounded-lg p-2 text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cedro-brown)]"
              aria-label={`${notasPendentes} nota(s) pendente(s)`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cedro-orange)] px-1 text-[10px] font-bold text-white">
                {notasPendentes > 99 ? "99+" : notasPendentes}
              </span>
            </Link>
          ) : null}

          <div className="hidden sm:block">
            <UserMenu nomeUsuario={nomeUsuario} variant="header" />
          </div>
        </div>
      </div>
    </header>
  );
}
