"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import GastoForm from "@/app/components/GastoForm";

export type GastoObra = {
  id: string;
  etapa: string;
  categoria: string;
  descricao: string;
  fornecedor: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number | null;
  data_gasto: string | null;
};

type ObraGastosSectionProps = {
  obraId: string;
  gastos: GastoObra[];
  totalGasto: number;
  gastosPorEtapa: { etapa: string; total: number }[];
};

export default function ObraGastosSection({
  obraId,
  gastos,
  totalGasto,
  gastosPorEtapa,
}: ObraGastosSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Gastos da obra
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total gasto:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatCurrency(totalGasto)}
            </span>
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Adicionar gasto
          </button>
        )}
      </div>

      {showForm && (
        <GastoForm
          obraId={obraId}
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {gastosPorEtapa.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Gastos por etapa
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gastosPorEtapa.map((item) => (
              <div
                key={item.etapa}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.etapa}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(item.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {gastos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum gasto registrado para esta obra.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  {[
                    "Data",
                    "Etapa",
                    "Categoria",
                    "Descrição",
                    "Fornecedor",
                    "Qtd.",
                    "Unit.",
                    "Total",
                  ].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {gastos.map((gasto) => (
                  <tr
                    key={gasto.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatDate(gasto.data_gasto)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                      {gasto.etapa}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {gasto.categoria}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                      {gasto.descricao}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {gasto.fornecedor ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {gasto.quantidade ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatCurrency(gasto.valor_unitario ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(gasto.valor_total ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
