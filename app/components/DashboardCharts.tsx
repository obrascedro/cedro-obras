"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { DistribuicaoItem } from "@/lib/dashboard";
import type { GastoEtapaItem } from "@/lib/gastos-etapa";

type DashboardChartsProps = {
  gastosPorEtapa: GastoEtapaItem[];
  gastosPorCategoria: DistribuicaoItem[];
};

const CORES_BARRAS = [
  "#18181b",
  "#27272a",
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
];

const CORES_PIZZA = [
  "#18181b",
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#27272a",
];

function TooltipEtapa({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: GastoEtapaItem }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.etapa}</p>
      <p className="text-zinc-600 dark:text-zinc-400">
        {formatCurrency(item.total)} — {item.percentual}%
      </p>
    </div>
  );
}

function TooltipCategoria({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DistribuicaoItem & { percentual: number } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.label}</p>
      <p className="text-zinc-600 dark:text-zinc-400">
        {formatCurrency(item.total)} — {item.percentual ?? 0}%
      </p>
    </div>
  );
}

export default function DashboardCharts({
  gastosPorEtapa,
  gastosPorCategoria,
}: DashboardChartsProps) {
  const categoriasComPercentual = gastosPorCategoria.map((item) => ({
    ...item,
    percentual: item.percentual ?? 0,
  }));

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Gastos por etapa
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Valor gasto em cada etapa da obra.
        </p>

        {gastosPorEtapa.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum gasto cadastrado para exibir.
          </p>
        ) : (
          <div className="mt-6 h-[320px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gastosPorEtapa}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value: number) => formatCurrency(value)}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-zinc-500 dark:text-zinc-400"
                />
                <YAxis
                  type="category"
                  dataKey="etapa"
                  width={110}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-zinc-700 dark:text-zinc-300"
                />
                <Tooltip
                  content={<TooltipEtapa />}
                  cursor={{ fill: "rgba(113,113,122,0.12)" }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
                  {gastosPorEtapa.map((item, index) => (
                    <Cell
                      key={item.etapa}
                      fill={CORES_BARRAS[index % CORES_BARRAS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Distribuição dos gastos por categoria
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Proporção dos gastos por tipo de despesa.
        </p>

        {categoriasComPercentual.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum gasto cadastrado para exibir.
          </p>
        ) : (
          <>
            <div className="mt-6 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriasComPercentual}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {categoriasComPercentual.map((item, index) => (
                      <Cell
                        key={item.label}
                        fill={CORES_PIZZA[index % CORES_PIZZA.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipCategoria />} />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-4 space-y-2">
              {categoriasComPercentual.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {item.label}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(item.total)} — {item.percentual}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
