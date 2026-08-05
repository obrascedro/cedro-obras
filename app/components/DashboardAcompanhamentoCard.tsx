import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import type { DashboardAcompanhamentoStats } from "@/lib/acompanhamento-obras/listar";

type DashboardAcompanhamentoCardProps = {
  stats: DashboardAcompanhamentoStats;
};

export default function DashboardAcompanhamentoCard({
  stats,
}: DashboardAcompanhamentoCardProps) {
  return (
    <section className="cedro-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(138_46_31/0.08)] text-[var(--cedro-brown)]">
          <Camera className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Atualizações de obra
          </h2>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {stats.totalUltimos7Dias}
          </p>
          <p className="text-xs text-zinc-500">nos últimos 7 dias</p>
          {stats.ultimaObraNome ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Última: <span className="font-medium">{stats.ultimaObraNome}</span>
              {stats.ultimoFuncionarioNome ? (
                <> · {stats.ultimoFuncionarioNome}</>
              ) : null}
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              Nenhuma atualização registrada ainda.
            </p>
          )}
          <Link
            href="/acompanhamento-obras"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cedro-brown)] hover:underline"
          >
            Ver acompanhamento
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
