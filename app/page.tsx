import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {APP_NAME}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="text-center">
          <p className="text-sm font-semibold tracking-widest text-emerald-600 uppercase">
            Construção civil inteligente
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Gestão de obras, gastos e notas fiscais em um só lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
            Controle financeiro das obras, aprovação de notas fiscais e envio
            pelo portal dos funcionários — com leitura automática por IA.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/portal/notas"
            className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/50 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">
              Funcionários
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Portal de Notas
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Envie notas fiscais pelo celular com foto ou PDF.
            </p>
          </Link>

          <Link
            href="/admin"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Administrativo
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Painel Admin
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Aprovar notas, gerenciar obras, clientes e financeiro.
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Diretoria
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Indicadores, gráficos, alertas e pendências.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}
