import DashboardChartsLazy from "@/app/components/dashboard/DashboardChartsLazy";
import { obterDashboardAnalyticsEmCache } from "@/lib/dashboard-data";

type DashboardChartsSectionProps = {
  obraId: string | null;
};

export default async function DashboardChartsSection({
  obraId,
}: DashboardChartsSectionProps) {
  const analytics = await obterDashboardAnalyticsEmCache(obraId);

  const semGastosObra =
    analytics.obraFiltrada &&
    analytics.gastosLista.length === 0 &&
    !analytics.errors.gastos;

  return (
    <>
      {semGastosObra ? (
        <div className="rounded-xl border border-dashed border-[var(--cedro-border)] bg-[var(--cedro-bg)] p-4 text-sm text-[var(--cedro-text-muted)]">
          Ainda não existem gastos cadastrados para esta obra.
        </div>
      ) : null}

      {analytics.errors.gastos ? (
        <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
          Erro ao carregar gastos para gráficos: {analytics.errors.gastos}
        </div>
      ) : (
        <DashboardChartsLazy
          gastosPorEtapa={analytics.gastosPorEtapa}
          gastosPorCategoria={analytics.gastosPorCategoria}
        />
      )}
    </>
  );
}
