import Link from "next/link";

type IconProps = {
  className?: string;
};

function IconCompras({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h18l-2 11H5L3 7zm2-3h14l1 3H4l1-3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11v6M15 11v6" />
    </svg>
  );
}

function IconMaoDeObra({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11a3 3 0 100-6 3 3 0 000 6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h2M18 10h2" />
    </svg>
  );
}

function IconFretes({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h11v8H3V7zm11 2h4l2 3v3h-6V9z"
      />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function IconNotasFiscais({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v4h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h4" />
    </svg>
  );
}

function IconContasAPagar({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 15h4" />
    </svg>
  );
}

function IconAssistente({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l2.5 7.5H22l-6 4.5 2.5 7.5L12 18l-6.5 4.5 2.5-7.5-6-4.5h7.5L12 3z"
      />
    </svg>
  );
}

function IconRelatorios({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17V11M12 17V7M16 17v-4" />
    </svg>
  );
}

const MODULOS = [
  {
    titulo: "Compras",
    descricao: "Gerencie pedidos, fornecedores e materiais adquiridos para as obras.",
    Icon: IconCompras,
    href: null,
  },
  {
    titulo: "Mão de obra",
    descricao: "Controle pagamentos, equipes e serviços executados nas etapas da obra.",
    Icon: IconMaoDeObra,
    href: null,
  },
  {
    titulo: "Fretes",
    descricao: "Acompanhe transportes, entregas e custos logísticos vinculados às obras.",
    Icon: IconFretes,
    href: null,
  },
  {
    titulo: "Notas fiscais",
    descricao: "Organize notas fiscais recebidas e mantenha o histórico documental em dia.",
    Icon: IconNotasFiscais,
    href: "/financeiro/notas-fiscais",
  },
  {
    titulo: "Contas a pagar",
    descricao: "Visualize vencimentos, pendências e compromissos financeiros do negócio.",
    Icon: IconContasAPagar,
    href: null,
  },
  {
    titulo: "Engenheiro Cedro",
    descricao:
      "Assistente inteligente que responde perguntas sobre obras, gastos, fornecedores e orçamentos.",
    Icon: IconAssistente,
    href: "/financeiro/assistente",
  },
  {
    titulo: "Relatórios",
    descricao: "Acesse indicadores financeiros consolidados para tomada de decisão.",
    Icon: IconRelatorios,
    href: null,
  },
] as const;

export default function FinanceiroModulos() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {MODULOS.map(({ titulo, descricao, Icon, href }) => (
        <article
          key={titulo}
          className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {titulo}
          </h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {descricao}
          </p>
          {href ? (
            <Link
              href={href}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Acessar
            </Link>
          ) : (
            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Acessar
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
