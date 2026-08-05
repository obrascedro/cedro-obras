"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import {
  agruparGastosPorEtapaDetalhado,
  resumirGastosPorEtapa,
  type GastoEtapaItem,
} from "@/lib/gastos-etapa";

type GastosPorEtapaChartProps = {
  gastos: { etapa: string; valor_total: number | null }[];
};

const CORES_BARRAS = [
  "#18181b",
  "#27272a",
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
];

function TooltipConteudo({
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

export default function GastosPorEtapaChart({ gastos }: GastosPorEtapaChartProps) {
  const itens = agruparGastosPorEtapaDetalhado(gastos);
  const resumo = resumirGastosPorEtapa(itens);

  if (!itens.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Distribuição dos gastos por etapa
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Nenhum gasto detalhado cadastrado para esta obra.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Distribuição dos gastos por etapa
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Visão consolidada dos gastos detalhados da obra.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Total gasto detalhado
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(resumo.totalDetalhado)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Etapa com maior gasto
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {resumo.maiorEtapa?.etapa ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Percentual da maior etapa
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {resumo.percentualMaiorEtapa}%
            </p>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full sm:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={itens}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
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
              width={120}
              tick={{ fill: "currentColor", fontSize: 12 }}
              className="text-zinc-700 dark:text-zinc-300"
            />
            <Tooltip content={<TooltipConteudo />} cursor={{ fill: "rgba(113,113,122,0.12)" }} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
              {itens.map((item, index) => (
                <Cell
                  key={item.etapa}
                  fill={CORES_BARRAS[index % CORES_BARRAS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-6 space-y-3">
        {itens.map((item) => (
          <li
            key={item.etapa}
            className="flex flex-col gap-1 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {item.etapa}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {formatCurrency(item.total)} — {item.percentual}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
