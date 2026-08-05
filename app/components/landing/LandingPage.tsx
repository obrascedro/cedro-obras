import Link from "next/link";
import CedroLogo from "@/app/components/brand/CedroLogo";
import { APP_TAGLINE } from "@/lib/brand";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--cedro-bg)]">
      <header className="border-b border-[var(--cedro-border)] bg-[var(--cedro-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <CedroLogo variant="header" href="/" priority />
          <Link
            href="/login"
            className="cedro-btn-primary px-4 py-2.5 text-sm"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <CedroLogo variant="login" priority className="mb-8" />
        <p className="max-w-xl text-lg leading-relaxed text-[var(--cedro-text-muted)] sm:text-xl">
          {APP_TAGLINE}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="cedro-btn-primary px-8 py-3.5 text-base"
          >
            Acessar o sistema
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--cedro-border)] bg-[var(--cedro-surface)] py-6 text-center text-sm text-[var(--cedro-text-muted)]">
        © {new Date().getFullYear()} Cedro Projetos e Construções
      </footer>
    </div>
  );
}
