import Link from "next/link";
import PageShell from "@/app/components/PageShell";

const modulos = [
  {
    href: "/admin/funcionarios",
    titulo: "Funcionários",
    descricao: "Cadastrar usuários, perfis, senhas e status de acesso.",
  },
  {
    href: "/admin/auditoria",
    titulo: "Auditoria",
    descricao: "Log de atividades administrativas, filtros e exportação.",
  },
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
            className="cedro-card p-6 transition-colors hover:border-[var(--cedro-border-strong)] hover:bg-[var(--cedro-bg)]"
          >
            <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
              {modulo.titulo}
            </h2>
            <p className="mt-2 text-sm text-[var(--cedro-text-muted)]">
              {modulo.descricao}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
