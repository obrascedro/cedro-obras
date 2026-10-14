"use client";

import dynamic from "next/dynamic";
import type { DistribuicaoItem } from "@/lib/dashboard";
import type { GastoEtapaItem } from "@/lib/gastos-etapa";

const DashboardCharts = dynamic(
  () => import("@/app/components/DashboardCharts"),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="cedro-card h-72 animate-pulse bg-[var(--cedro-bg)]" />
        <div className="cedro-card h-72 animate-pulse bg-[var(--cedro-bg)]" />
      </div>
    ),
    ssr: false,
  }
);

type DashboardChartsLazyProps = {
  gastosPorEtapa: GastoEtapaItem[];
  gastosPorCategoria: DistribuicaoItem[];
};

export default function DashboardChartsLazy(props: DashboardChartsLazyProps) {
  return <DashboardCharts {...props} />;
}
