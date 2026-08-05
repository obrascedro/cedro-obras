"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import ObraEditarModal, {
  type ObraEditarDados,
} from "@/app/components/obras/ObraEditarModal";
import ObraRecebimentosModal from "@/app/components/obras/ObraRecebimentosModal";
import { btnSecondaryClassName } from "@/app/components/ui/form-styles";
import { formatCurrency, formatDate } from "@/lib/format";

type ClienteOption = { id: string; nome: string };

export type ObraResumoUi = {
  id: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
  status: string;
  orcamentoPrevisto: number;
  valorRecebido: number;
  gastoRealizado: number;
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  areaM2: number | null;
  observacoes: string | null;
};

type ObraDetalheResumoProps = {
  obra: ObraResumoUi;
  isAdmin: boolean;
  clientes: ClienteOption[];
  statusBadgeClass: string;
};

export default function ObraDetalheResumo({
  obra,
  isAdmin,
  clientes,
  statusBadgeClass,
}: ObraDetalheResumoProps) {
  const [modalEditar, setModalEditar] = useState(false);
  const [modalRecebimentos, setModalRecebimentos] = useState(false);

  const lucroEstimado = obra.valorRecebido - obra.gastoRealizado;

  const dadosEditar: ObraEditarDados = {
    id: obra.id,
    nome: obra.nome,
    clienteId: obra.clienteId,
    status: obra.status,
    orcamentoPrevisto: obra.orcamentoPrevisto,
    dataInicio: obra.dataInicio ?? "",
    dataPrevisaoTermino: obra.dataPrevisaoTermino ?? "",
    areaM2: obra.areaM2,
    observacoes: obra.observacoes ?? "",
  };

  return (
    <>
      {isAdmin ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setModalEditar(true)}
            className={btnSecondaryClassName}
          >
            <Pencil className="mr-1.5 inline h-4 w-4" />
            Editar dados da obra
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="cedro-card p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass}`}
            >
              {obra.status}
            </span>
            {obra.areaM2 ? (
              <span className="text-sm text-[var(--cedro-text-muted)]">
                {obra.areaM2} m²
              </span>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
                Cliente
              </dt>
              <dd className="mt-1 text-sm text-[var(--cedro-text)]">
                {obra.clienteNome}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
                Data de início
              </dt>
              <dd className="mt-1 text-sm text-[var(--cedro-text)]">
                {formatDate(obra.dataInicio)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
                Previsão de término
              </dt>
              <dd className="mt-1 text-sm text-[var(--cedro-text)]">
                {formatDate(obra.dataPrevisaoTermino)}
              </dd>
            </div>
          </dl>

          {obra.observacoes ? (
            <div className="mt-4 border-t border-[var(--cedro-border)] pt-4">
              <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
                Observações
              </p>
              <p className="mt-1 text-sm text-[var(--cedro-text)]">
                {obra.observacoes}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="cedro-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Orçamento previsto
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--cedro-text)]">
              {formatCurrency(obra.orcamentoPrevisto)}
            </p>
          </div>

          <div className="cedro-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Valor recebido
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--cedro-text)]">
              {formatCurrency(obra.valorRecebido)}
            </p>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setModalRecebimentos(true)}
                className="mt-2 text-sm font-medium text-[var(--cedro-brown)] hover:underline"
              >
                Ver recebimentos
              </button>
            ) : null}
          </div>

          <div className="cedro-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Gasto realizado
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--cedro-text)]">
              {formatCurrency(obra.gastoRealizado)}
            </p>
            <p className="mt-1 text-xs text-[var(--cedro-text-muted)]">
              Calculado pelos gastos da obra
            </p>
          </div>

          <div className="cedro-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Lucro estimado
            </p>
            <p
              className={`mt-2 text-xl font-semibold ${
                lucroEstimado >= 0
                  ? "text-[var(--cedro-success)]"
                  : "text-[var(--cedro-error)]"
              }`}
            >
              {formatCurrency(lucroEstimado)}
            </p>
          </div>
        </div>
      </div>

      {modalEditar && isAdmin ? (
        <ObraEditarModal
          obra={dadosEditar}
          clientes={clientes}
          onFechar={() => setModalEditar(false)}
        />
      ) : null}

      {modalRecebimentos && isAdmin ? (
        <ObraRecebimentosModal
          obraId={obra.id}
          obraNome={obra.nome}
          onFechar={() => setModalRecebimentos(false)}
        />
      ) : null}
    </>
  );
}
