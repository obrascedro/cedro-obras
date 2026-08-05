import Link from "next/link";
import PageShell from "@/app/components/PageShell";

const modulos = [
  {
    href: "/financeiro/notas-fiscais",
    titulo: "Notas fiscais",
    descricao: "Aprovar pendências, conferir leituras IA e histórico.",
  },
  {
    href: "/obras",
    titulo: "Obras",
    descricao: "Cadastro, gastos e acompanhamento por obra.",
  },
  {
    href: "/clientes",
    titulo: "Clientes",
    descricao: "Cadastro e gestão de clientes.",
  },
  {
    href: "/financeiro",
    titulo: "Financeiro",
    descricao: "Módulos financeiros e Engenheiro Cedro.",
  },
];

export default function AdminPage() {
  return (
    <PageShell
      title="Painel administrativo"
      description="Acesso centralizado às ferramentas de gestão."
      maxWidth="full"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {modulo.titulo}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {modulo.descricao}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
