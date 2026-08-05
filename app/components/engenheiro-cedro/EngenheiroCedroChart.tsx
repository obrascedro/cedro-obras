"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { GraficoAssistente } from "@/lib/engenheiro-cedro-types";

const CORES = [
  "#18181b",
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
];

type EngenheiroCedroChartProps = {
  grafico: GraficoAssistente;
};

export default function EngenheiroCedroChart({
  grafico,
}: EngenheiroCedroChartProps) {
  const dados = grafico.dados.map((d) => ({
    name: d.label.length > 18 ? `${d.label.slice(0, 16)}…` : d.label,
    valor: d.valor,
    percentual: d.percentual,
    labelCompleto: d.label,
  }));

  if (dados.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {grafico.titulo}
      </p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {grafico.tipo === "pie" ? (
            <PieChart>
              <Pie
                data={dados}
                dataKey="valor"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {dados.map((_, index) => (
                  <Cell key={index} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  formatCurrency(typeof value === "number" ? value : Number(value))
                }
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid #e4e4e7",
                  fontSize: "0.875rem",
                }}
              />
            </PieChart>
          ) : (
            <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <Tooltip
                formatter={(value) =>
                  formatCurrency(typeof value === "number" ? value : Number(value))
                }
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.labelCompleto ?? ""
                }
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid #e4e4e7",
                  fontSize: "0.875rem",
                }}
              />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {dados.map((_, index) => (
                  <Cell key={index} fill={CORES[index % CORES.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
