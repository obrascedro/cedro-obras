"use client";

import { formatCurrency } from "@/lib/format";
import {
  CATEGORIAS_NOTA_FISCAL,
  ETAPAS_NOTA_FISCAL,
  MENSAGEM_REVISAO_CLASSIFICACAO,
} from "@/lib/nota-fiscal-constants";
import type { AlertasLeitura } from "@/lib/nota-fiscal-validacao";
import type { NotaFiscalItemExtraido } from "@/lib/nota-fiscal-ia";
import { formatarConfiancaPercentual } from "@/lib/gastos-classificacao-motor";
import { inputClassName, selectClassName } from "@/app/components/ui/form-styles";

type NotaFiscalLeituraPreviewProps = {
  itens: NotaFiscalItemExtraido[];
  onItemChange: (
    id: string,
    field: keyof NotaFiscalItemExtraido,
    value: string | number | boolean
  ) => void;
  onRemoveItem: (id: string) => void;
  onAddItem?: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReject?: () => void;
  onRequestCorrection?: () => void;
  loading?: boolean;
  totalItens: number;
  valorTotalNota?: number;
  alertas?: AlertasLeitura | null;
  /** funcionario = envia para aprovação; aprovador = lança gastos */
  variant?: "funcionario" | "aprovador";
  readOnly?: boolean;
};

export default function NotaFiscalLeituraPreview({
  itens,
  onItemChange,
  onRemoveItem,
  onAddItem,
  onConfirm,
  onCancel,
  onReject,
  onRequestCorrection,
  loading = false,
  totalItens,
  valorTotalNota,
  alertas,
  variant = "funcionario",
  readOnly = false,
}: NotaFiscalLeituraPreviewProps) {
  const itensPendentes = itens.filter(
    (item) => item.necessita_revisao && !item.revisado_pelo_usuario
  ).length;

  return (
    <div className="mt-6 rounded-2xl border border-[var(--cedro-warning-border)] bg-[var(--cedro-warning-bg)] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--cedro-text)]">
            {variant === "aprovador"
              ? "Conferência — aprovação"
              : "Revisão — leitura com IA"}
          </h3>
          <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
            {variant === "aprovador"
              ? "Confira os dados antes de aprovar o lançamento financeiro."
              : "Revise os dados. Os gastos só serão lançados após aprovação."}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="font-medium text-[var(--cedro-text)]">
            Soma dos itens: {formatCurrency(totalItens)}
          </span>
          {valorTotalNota != null && valorTotalNota > 0 ? (
            <span className="text-[var(--cedro-text-muted)]">
              Valor da nota: {formatCurrency(valorTotalNota)}
            </span>
          ) : null}
        </div>
      </div>

      {alertas?.divergenciaValor ? (
        <p className="mt-3 rounded-lg border border-[var(--cedro-warning-border)] bg-[var(--cedro-warning-bg)] px-3 py-2 text-sm text-[var(--cedro-text)]">
          Atenção: a soma dos itens difere do valor total da nota em{" "}
          {formatCurrency(alertas.diferencaValor)}.
        </p>
      ) : null}

      {itensPendentes > 0 ? (
        <p className="mt-3 rounded-lg border border-[var(--cedro-warning-border)] bg-[var(--cedro-warning-bg)] px-3 py-2 text-sm text-[var(--cedro-text)]">
          {itensPendentes} item(ns) — {MENSAGEM_REVISAO_CLASSIFICACAO}
        </p>
      ) : null}

      <div className="cedro-card mt-4 overflow-hidden">
        <div className="cedro-table-wrap">
          <table className="cedro-table">
            <thead>
              <tr>
                {[
                  "Produto",
                  "Qtd.",
                  "Un.",
                  "V. unit.",
                  "V. total",
                  "Categoria",
                  "Etapa",
                  "",
                ].map((header) => (
                  <th
                    key={header || "actions"}
                    scope="col"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
            {itens.map((item) => (
              <tr
                key={item.id}
                className={
                  item.necessita_revisao && !item.revisado_pelo_usuario
                    ? "bg-[var(--cedro-warning-bg)]"
                    : undefined
                }
              >
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={(event) =>
                      onItemChange(item.id, "descricao", event.target.value)
                    }
                    className={`${inputClassName} min-w-[160px]`}
                    readOnly={readOnly}
                    disabled={readOnly}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantidade}
                    onChange={(event) =>
                      onItemChange(
                        item.id,
                        "quantidade",
                        Number(event.target.value)
                      )
                    }
                    className={`${inputClassName} w-20`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.unidade}
                    onChange={(event) =>
                      onItemChange(item.id, "unidade", event.target.value)
                    }
                    placeholder="UN"
                    className={`${inputClassName} w-16`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(event) =>
                      onItemChange(
                        item.id,
                        "valor_unitario",
                        Number(event.target.value)
                      )
                    }
                    className={`${inputClassName} w-24`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valor_total}
                    onChange={(event) =>
                      onItemChange(
                        item.id,
                        "valor_total",
                        Number(event.target.value)
                      )
                    }
                    className={`${inputClassName} w-24`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <select
                      value={item.categoria}
                      onChange={(event) =>
                        onItemChange(item.id, "categoria", event.target.value)
                      }
                      className={`${selectClassName} min-w-[130px]`}
                    >
                      {CATEGORIAS_NOTA_FISCAL.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                    {item.necessita_revisao && !item.revisado_pelo_usuario ? (
                      <span className="text-xs text-[var(--cedro-orange)]">
                        {formatarConfiancaPercentual(
                          (item.confianca_categoria + item.confianca_etapa) / 2
                        )}{" "}
                        — {item.mensagem_revisao ?? MENSAGEM_REVISAO_CLASSIFICACAO}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.etapa}
                    onChange={(event) =>
                      onItemChange(item.id, "etapa", event.target.value)
                    }
                    className={`${selectClassName} min-w-[150px]`}
                  >
                    {ETAPAS_NOTA_FISCAL.map((etapa) => (
                      <option key={etapa} value={etapa}>
                        {etapa}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-xs font-medium text-[var(--cedro-error)] hover:text-[var(--cedro-brown-dark)]"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {onAddItem ? (
        <button
          type="button"
          onClick={onAddItem}
          className="mt-3 text-sm font-medium text-[var(--cedro-brown)] underline-offset-4 hover:underline"
        >
          + Adicionar item
        </button>
      ) : null}

      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--cedro-orange)]">
          Nenhum produto identificado. Adicione itens manualmente ou envie outra
          nota.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[var(--cedro-warning-border)] pt-5 sm:flex-row sm:flex-wrap sm:justify-end">
        {variant === "aprovador" && onRequestCorrection ? (
          <button
            type="button"
            onClick={onRequestCorrection}
            disabled={loading}
            className="cedro-btn-warning px-5 py-2.5 text-sm disabled:opacity-60"
          >
            Solicitar correção
          </button>
        ) : null}
        {variant === "aprovador" && onReject ? (
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="cedro-btn-danger px-5 py-2.5 text-sm disabled:opacity-60"
          >
            Rejeitar
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="cedro-btn-secondary px-5 py-2.5 text-sm"
        >
          {variant === "aprovador" ? "Fechar" : "Descartar leitura"}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={
            loading || itens.length === 0 || itensPendentes > 0
          }
          className="cedro-btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {loading
            ? "Processando..."
            : variant === "aprovador"
              ? "Aprovar e lançar gastos"
              : "Enviar para aprovação"}
        </button>
      </div>
    </div>
  );
}
