"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import Select from "@/app/components/ui/Select";
import { statusBadgeClass } from "@/lib/dashboard";
import type { ObraFiltroOpcao } from "@/lib/dashboard-filtro";

type DashboardObraFilterProps = {
  obras: ObraFiltroOpcao[];
  obraSelecionadaId: string | null;
  obraSelecionadaNome: string | null;
  children: ReactNode;
};

export default function DashboardObraFilter({
  obras,
  obraSelecionadaId,
  obraSelecionadaNome,
  children,
}: DashboardObraFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const obraAtiva = obras.find((obra) => obra.id === obraSelecionadaId);

  function navegarParaObra(value: string) {
    startTransition(() => {
      if (!value || value === "todas") {
        router.push("/dashboard");
        return;
      }
      router.push(`/dashboard?obra=${encodeURIComponent(value)}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="cedro-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-md">
            <Select
              label="Filtrar por obra"
              id="dashboard-obra-filtro"
              value={obraSelecionadaId ?? "todas"}
              onChange={(event) => navegarParaObra(event.target.value)}
              disabled={isPending}
              className="w-full"
            >
              <option value="todas">Todas as obras</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </Select>
          </div>

          {obraSelecionadaId && obraSelecionadaNome ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[rgb(138_46_31/0.08)] px-3 py-1 text-sm font-medium text-[var(--cedro-brown)]">
                  Visualizando: {obraSelecionadaNome}
                </span>
                {obraAtiva ? (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(obraAtiva.status)}`}
                  >
                    {obraAtiva.status}
                  </span>
                ) : null}
              </div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--cedro-text-muted)] underline-offset-4 hover:text-[var(--cedro-brown)] hover:underline"
                onClick={(event) => {
                  event.preventDefault();
                  navegarParaObra("todas");
                }}
              >
                Limpar filtro
              </Link>
            </div>
          ) : null}
        </div>

        {isPending ? (
          <p className="mt-3 text-sm text-[var(--cedro-text-muted)]" role="status">
            Atualizando visão do dashboard…
          </p>
        ) : null}
      </section>

      <div
        className={`flex flex-col gap-6 transition-opacity duration-200 ${
          isPending ? "pointer-events-none opacity-60" : ""
        }`}
        aria-busy={isPending}
      >
        {children}
      </div>
    </div>
  );
}
