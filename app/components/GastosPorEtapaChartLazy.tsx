"use client";

import dynamic from "next/dynamic";
type GastosPorEtapaChartLazyProps = {
  obraId: string;
  gastos: { etapa: string; valor_total: number | null }[];
};

const GastosPorEtapaChart = dynamic(
  () => import("@/app/components/GastosPorEtapaChart"),
  {
    loading: () => (
      <div
        className="cedro-card h-64 animate-pulse bg-[var(--cedro-bg)]"
        aria-busy="true"
        aria-label="Carregando gráfico de gastos por etapa"
      />
    ),
    ssr: false,
  }
);

export default function GastosPorEtapaChartLazy(
  props: GastosPorEtapaChartLazyProps
) {
  return <GastosPorEtapaChart {...props} />;
}
