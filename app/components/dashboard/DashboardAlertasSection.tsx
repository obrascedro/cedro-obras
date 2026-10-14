import Link from "next/link";
import { alertaBadgeClass } from "@/lib/dashboard";
import { obterDashboardAnalyticsEmCache } from "@/lib/dashboard-data";

type DashboardAlertasSectionProps = {
  obraId: string | null;
};

export default async function DashboardAlertasSection({
  obraId,
}: DashboardAlertasSectionProps) {
  const analytics = await obterDashboardAnalyticsEmCache(obraId);
  const obraFiltrada = analytics.obraFiltrada;

  return (
    <div className="cedro-card p-6">
      <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
        Alertas
      </h2>
      <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
        {obraFiltrada
          ? "Situações que precisam de atenção nesta obra."
          : "Obras que precisam de atenção."}
      </p>

      {analytics.alertas.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--cedro-text-muted)]">
          {obraFiltrada
            ? "Nenhum alerta para esta obra no momento."
            : "Nenhum alerta no momento."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {analytics.alertas.map((alerta) => (
            <li
              key={alerta.id}
              className={`rounded-xl border px-4 py-3 ${alertaBadgeClass(alerta.tipo)}`}
            >
              <Link
                href={`/obras/${alerta.obraId}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {alerta.nome}
              </Link>
              <p className="mt-1 text-sm">{alerta.mensagem}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
