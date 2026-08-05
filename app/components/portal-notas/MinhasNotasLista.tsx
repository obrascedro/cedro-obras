"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PortalErrorBanner } from "@/app/components/portal-notas/PortalWarningBanner";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { portalCardClassName } from "@/app/components/ui/form-styles";
import {
  FILTROS_MINHAS_NOTAS,
  formatDataHoraEnvio,
  formatReferenciaNota,
  formatStatusFuncionario,
  notaPassaFiltroFuncionario,
  type FiltroMinhasNotas,
} from "@/lib/portal-notas/status-funcionario";
import type { NotaFuncionarioResumo } from "@/lib/portal-notas/minhas-notas";
import { formatCurrency } from "@/lib/format";
import { normalizarStatusNota } from "@/lib/notas-fiscais-status";

type MinhasNotasListaProps = {
  notas: NotaFuncionarioResumo[];
};

function normalizarBusca(valor: string): string {
  return valor.trim().toLowerCase();
}

function statusBadgeVariant(
  status: string
): "success" | "warning" | "error" | "neutral" | "teal" {
  switch (normalizarStatusNota(status)) {
    case "aguardando":
      return "neutral";
    case "processando":
      return "teal";
    case "pendente_aprovacao":
    case "correcao_solicitada":
      return "warning";
    case "aprovada":
      return "success";
    case "rejeitada":
    case "erro":
      return "error";
    default:
      return "teal";
  }
}

export default function MinhasNotasLista({ notas }: MinhasNotasListaProps) {
  const [filtro, setFiltro] = useState<FiltroMinhasNotas>("todas");
  const [busca, setBusca] = useState("");

  const notasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca);
    return notas.filter((nota) => {
      if (!notaPassaFiltroFuncionario(nota.status_processamento, filtro)) {
        return false;
      }
      if (!termo) return true;
      const ref = formatReferenciaNota(nota.id).toLowerCase();
      const fornecedor = (nota.fornecedor ?? "").toLowerCase();
      const arquivo = nota.arquivo_nome.toLowerCase();
      return (
        ref.includes(termo) ||
        fornecedor.includes(termo) ||
        arquivo.includes(termo)
      );
    });
  }, [notas, filtro, busca]);

  return (
    <article className={portalCardClassName}>
      <header className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(138_46_31/0.08)] text-[var(--cedro-brown)]">
          <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--cedro-text)] sm:text-[1.0625rem]">
            Minhas notas
          </h2>
          <p className="mt-0.5 text-sm text-[var(--cedro-text-muted)]">
            Acompanhe o status das notas que você enviou.
          </p>
        </div>
      </header>

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cedro-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar fornecedor, referência ou arquivo…"
          aria-label="Buscar notas"
          className="h-11 w-full rounded-xl border border-[var(--cedro-border)] bg-white pl-10 pr-3.5 text-sm text-[var(--cedro-text)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--cedro-text-muted)] focus:border-[var(--cedro-brown)] focus:ring-2 focus:ring-[rgb(138_46_31/0.12)]"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS_MINHAS_NOTAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-all duration-150 ${
              filtro === item.id
                ? "bg-[var(--cedro-brown)] text-white ring-[var(--cedro-brown)]"
                : "bg-[#fafafa] text-[var(--cedro-text-muted)] ring-[var(--cedro-border)] hover:bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--cedro-border)] bg-[#fafafa] px-4 py-8 text-center text-sm text-[var(--cedro-text-muted)]">
          Você ainda não enviou nenhuma nota.
        </p>
      ) : notasFiltradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--cedro-border)] bg-[#fafafa] px-4 py-8 text-center text-sm text-[var(--cedro-text-muted)]">
          Nenhuma nota encontrada com esse filtro.
        </p>
      ) : (
        <ul className="space-y-3">
          {notasFiltradas.map((nota) => (
            <li key={nota.id}>
              <Link
                href={`/portal/minhas-notas/${nota.id}`}
                className="block rounded-xl border border-[var(--cedro-border)] bg-[#fafafa] p-4 transition-all duration-150 hover:border-[rgb(138_46_31/0.2)] hover:bg-white hover:shadow-[0_1px_8px_rgb(32_37_43/0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-[var(--cedro-text-muted)]">
                      #{formatReferenciaNota(nota.id)}
                    </p>
                    <p className="mt-1 truncate font-medium text-[var(--cedro-text)]">
                      {nota.obra_nome}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--cedro-text-muted)]">
                      {formatDataHoraEnvio(nota.criado_em)}
                    </p>
                  </div>
                  <StatusBadge variant={statusBadgeVariant(nota.status_processamento)}>
                    {formatStatusFuncionario(nota.status_processamento)}
                  </StatusBadge>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <dt className="text-[var(--cedro-text-muted)]">Fornecedor</dt>
                    <dd className="truncate text-[var(--cedro-text)]">
                      {nota.fornecedor ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--cedro-text-muted)]">Valor</dt>
                    <dd className="text-[var(--cedro-text)]">
                      {nota.valor_total != null
                        ? formatCurrency(nota.valor_total)
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {nota.status_processamento === "erro" ? (
                  <div className="mt-3">
                    <PortalErrorBanner title="Não foi possível processar esta nota. Procure o administrador." />
                  </div>
                ) : null}

                <p className="mt-2.5 text-xs font-semibold text-[var(--cedro-brown)]">
                  Ver detalhes →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
