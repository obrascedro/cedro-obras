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
    <section className="cedro-card border-[var(--cedro-warning-border)] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
            Notas aguardando aprovação
          </h2>
          <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
            Gastos pendentes não afetam o financeiro até aprovação.
          </p>
        </div>
        <Link
          href="/financeiro/notas-fiscais"
          className="text-sm font-medium text-[var(--cedro-brown)] hover:text-[var(--cedro-brown-hover)]"
        >
          Conferir pendências →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
            Pendentes
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--cedro-text)]">
            {resumo.quantidadePendente}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
            Valor pendente
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--cedro-text)]">
            {formatCurrency(resumo.valorTotalPendente)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
            Com erro
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--cedro-error)]">
            {resumo.quantidadeErro}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
            Divergência
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--cedro-orange)]">
            {resumo.quantidadeDivergencia}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
            Baixa confiança
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--cedro-orange)]">
            {resumo.quantidadeBaixaConfianca}
          </p>
        </div>
      </div>
    </section>
  );
}
