import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import NotasPendentesNavBadge from "@/app/components/notas-fiscais/NotasPendentesNavBadge";
import { supabase } from "@/lib/supabase";

type PageShellProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "md" | "lg" | "xl" | "full";
};

const maxWidthClass = {
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
  full: "max-w-7xl",
};

export default async function PageShell({
  title,
  description,
  action,
  children,
  maxWidth = "lg",
}: PageShellProps) {
  const { count: notasPendentes } = await supabase
    .from("notas_fiscais")
    .select("*", { count: "exact", head: true })
    .in("status_processamento", ["pendente_aprovacao", "revisar"]);

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {APP_NAME}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {APP_TAGLINE}
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Admin
            </Link>
            <Link
              href="/clientes"
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Clientes
            </Link>
            <Link
              href="/obras"
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Obras
            </Link>
            <Link
              href="/financeiro"
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Financeiro
            </Link>
            <NotasPendentesNavBadge count={notasPendentes ?? 0} />
          </nav>
        </div>
      </header>

      <main
        className={`mx-auto px-4 py-8 sm:px-6 lg:px-8 ${maxWidthClass[maxWidth]}`}
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}
