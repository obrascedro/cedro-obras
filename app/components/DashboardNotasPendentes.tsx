import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { calcularResumoPendencias } from "@/lib/notas-fiscais-pendencias";

type DashboardNotasPendentesProps = {
  notas: Array<{
    status_processamento: string;
    valor_total: number | null;
    itens_json?: unknown;
  }>;
};

export default function DashboardNotasPendentes({
  notas,
}: DashboardNotasPendentesProps) {
  const resumo = calcularResumoPendencias(notas);

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/50 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Notas aguardando aprovação
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Gastos pendentes não afetam o financeiro até aprovação.
          </p>
        </div>
        <Link
          href="/financeiro/notas-fiscais"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Conferir pendências →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Pendentes
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {resumo.quantidadePendente}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Valor pendente
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(resumo.valorTotalPendente)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Com erro
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {resumo.quantidadeErro}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Divergência
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {resumo.quantidadeDivergencia}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Baixa confiança
          </p>
          <p className="mt-1 text-2xl font-semibold text-orange-600 dark:text-orange-400">
            {resumo.quantidadeBaixaConfianca}
          </p>
        </div>
      </div>
    </section>
  );
}
