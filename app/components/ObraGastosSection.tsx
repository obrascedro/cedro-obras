"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirGastoObraAdminAction } from "@/app/actions/gastos-admin";
import GastoEditarModal from "@/app/components/GastoEditarModal";
import GastoForm from "@/app/components/GastoForm";
import { btnPrimarySmClassName } from "@/app/components/ui/form-styles";
import { formatCurrency, formatDate } from "@/lib/format";
import { somarGastosMaoDeObra, urlGastosMaoDeObraObra } from "@/lib/gastos-mao-de-obra";
import { urlGastosEtapaObra } from "@/lib/gastos-etapa";
import type { GastoObraRow } from "@/lib/gastos-obra";

type ObraGastosSectionProps = {
  obraId: string;
  gastos: GastoObraRow[];
  totalGasto: number;
  gastosPorEtapa: { etapa: string; total: number }[];
  isAdmin?: boolean;
};

function badgeOrigem(origem: string | null) {
  if (origem === "migracao") {
    return (
      <span className="ml-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-950/40 dark:text-amber-300">
        Migração
      </span>
    );
  }
  return null;
}

export default function ObraGastosSection({
  obraId,
  gastos,
  totalGasto,
  gastosPorEtapa,
  isAdmin = false,
}: ObraGastosSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<GastoObraRow | null>(null);
  const [pending, startTransition] = useTransition();

  const totalMaoDeObra = somarGastosMaoDeObra(gastos);
  const exibirGastosPorEtapa =
    gastosPorEtapa.length > 0 || totalMaoDeObra > 0;

  function handleExcluir(gastoId: string) {
    if (!confirm("Excluir este gasto? O total da obra será recalculado.")) return;

    startTransition(async () => {
      const result = await excluirGastoObraAdminAction(gastoId);
      if (result.sucesso) {
        router.refresh();
      } else if (result.erro) {
        alert(result.erro);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
            Gastos da obra
          </h2>
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Total gasto:{" "}
            <span className="font-medium text-[var(--cedro-text)]">
              {formatCurrency(totalGasto)}
            </span>
          </p>
        </div>
        {isAdmin && !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={btnPrimarySmClassName}
          >
            Adicionar gasto
          </button>
        ) : null}
      </div>

      {showForm ? (
        <GastoForm
          obraId={obraId}
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      ) : null}

      {exibirGastosPorEtapa ? (
        <div className="cedro-card p-6">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
            Gastos por etapa
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {totalMaoDeObra > 0 ? (
              <Link
                href={urlGastosMaoDeObraObra(obraId)}
                className="group rounded-xl border border-[var(--cedro-brown)]/30 bg-[var(--cedro-bg)] px-4 py-3 transition-colors hover:border-[var(--cedro-brown)]/60 hover:bg-[var(--cedro-surface)]"
              >
                <p className="text-sm font-semibold text-[var(--cedro-brown)] group-hover:text-[var(--cedro-brown-dark)]">
                  Mão de obra
                </p>
                <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
                  {formatCurrency(totalMaoDeObra)}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--cedro-text-muted)] group-hover:text-[var(--cedro-brown)]">
                  Ver detalhes →
                </p>
              </Link>
            ) : null}
            {gastosPorEtapa.map((item) => (
              <Link
                key={item.etapa}
                href={urlGastosEtapaObra(obraId, item.etapa)}
                className="group rounded-xl border border-[var(--cedro-border)] bg-[var(--cedro-bg)] px-4 py-3 transition-colors hover:border-[var(--cedro-primary)]/40 hover:bg-[var(--cedro-surface)]"
              >
                <p className="text-sm font-medium text-[var(--cedro-text)] group-hover:text-[var(--cedro-primary)]">
                  {item.etapa}
                </p>
                <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
                  {formatCurrency(item.total)}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--cedro-text-muted)] group-hover:text-[var(--cedro-primary)]">
                  Ver detalhes →
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {gastos.length === 0 ? (
        <div className="cedro-card border-dashed p-10 text-center">
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Nenhum gasto registrado para esta obra.
          </p>
        </div>
      ) : (
        <div className="cedro-card overflow-hidden">
          <div className="cedro-table-wrap">
            <table className="cedro-table">
              <thead>
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
                    ...(isAdmin ? ["Ações"] : []),
                  ].map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatDate(gasto.data_gasto)}
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      {gasto.etapa}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {gasto.categoria}
                    </td>
                    <td className="text-[var(--cedro-text-muted)]">
                      {gasto.descricao}
                      {badgeOrigem(gasto.origem)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {gasto.fornecedor ?? "—"}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {gasto.quantidade ?? "—"}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatCurrency(gasto.valor_unitario ?? 0)}
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      {formatCurrency(gasto.valor_total ?? 0)}
                    </td>
                    {isAdmin ? (
                      <td className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditando(gasto)}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Editar gasto"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleExcluir(gasto.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label="Excluir gasto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando ? (
        <GastoEditarModal
          gasto={editando}
          onFechar={() => setEditando(null)}
        />
      ) : null}
    </div>
  );
}
