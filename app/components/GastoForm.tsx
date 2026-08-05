"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  criarGastoObraAdminAction,
} from "@/app/actions/gastos-admin";
import type { AdminActionState } from "@/app/actions/obras-admin";
import { formatCurrency, parseNumber } from "@/lib/format";
import {
  btnPrimarySmClassName,
  btnSecondaryClassName,
  cardClassName,
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import { CATEGORIAS_GASTO, ETAPAS_GASTO } from "@/lib/gastos-opcoes";

type GastoFormProps = {
  obraId: string;
  onCancel: () => void;
  onSuccess?: () => void;
};

export default function GastoForm({ obraId, onCancel, onSuccess }: GastoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, startTransition] = useTransition();

  const [etapa, setEtapa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [dataGasto, setDataGasto] = useState("");

  const valorTotal = useMemo(() => {
    return parseNumber(quantidade) * parseNumber(valorUnitario);
  }, [quantidade, valorUnitario]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.set("obraId", obraId);
    formData.set("etapa", etapa);
    formData.set("categoria", categoria);
    formData.set("descricao", descricao);
    formData.set("fornecedor", fornecedor);
    formData.set("quantidade", quantidade);
    formData.set("valorUnitario", valorUnitario);
    formData.set("dataGasto", dataGasto);

    startTransition(async () => {
      const result: AdminActionState = await criarGastoObraAdminAction({}, formData);
      setLoading(false);

      if (result.erro) {
        setError(result.erro);
        return;
      }

      setSuccess(result.sucesso ?? "Gasto cadastrado com sucesso");
      router.refresh();
      onSuccess?.();

      setEtapa("");
      setCategoria("");
      setDescricao("");
      setFornecedor("");
      setQuantidade("");
      setValorUnitario("");
      setDataGasto("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${cardClassName} p-6 sm:p-8`}
    >
      <h2 className="mb-5 text-lg font-semibold text-[var(--cedro-text)]">
        Novo gasto
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="etapa" className={labelClassName}>
            Etapa
          </label>
          <select
            id="etapa"
            required
            value={etapa}
            onChange={(event) => setEtapa(event.target.value)}
            className={selectClassName}
          >
            <option value="">Selecionar etapa</option>
            {ETAPAS_GASTO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className={labelClassName}>
            Categoria
          </label>
          <select
            id="categoria"
            required
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            className={selectClassName}
          >
            <option value="">Selecionar categoria</option>
            {CATEGORIAS_GASTO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="descricao" className={labelClassName}>
            Descrição
          </label>
          <input
            id="descricao"
            type="text"
            required
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Ex.: Cimento CP-II 50kg"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="fornecedor" className={labelClassName}>
            Fornecedor
          </label>
          <input
            id="fornecedor"
            type="text"
            value={fornecedor}
            onChange={(event) => setFornecedor(event.target.value)}
            placeholder="Ex.: Materiais São Paulo"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quantidade" className={labelClassName}>
            Quantidade
          </label>
          <input
            id="quantidade"
            type="number"
            min="0"
            step="0.01"
            required
            value={quantidade}
            onChange={(event) => setQuantidade(event.target.value)}
            placeholder="0"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="valor-unitario" className={labelClassName}>
            Valor unitário
          </label>
          <input
            id="valor-unitario"
            type="number"
            min="0"
            step="0.01"
            required
            value={valorUnitario}
            onChange={(event) => setValorUnitario(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="valor-total" className={labelClassName}>
            Valor total
          </label>
          <div
            id="valor-total"
            className="flex min-h-[42px] items-center rounded-lg border border-[var(--cedro-border)] bg-[var(--cedro-bg)] px-3 py-2.5 text-sm font-medium text-[var(--cedro-text)]"
          >
            {formatCurrency(valorTotal)}
          </div>
          <p className="text-xs text-[var(--cedro-text-muted)]">
            Calculado automaticamente: quantidade × valor unitário
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="data-gasto" className={labelClassName}>
            Data do gasto
          </label>
          <input
            id="data-gasto"
            type="date"
            required
            value={dataGasto}
            onChange={(event) => setDataGasto(event.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--cedro-border)] pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={btnSecondaryClassName}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className={btnPrimarySmClassName}
        >
          {loading ? "Salvando..." : "Salvar gasto"}
        </button>
      </div>

      {success && (
        <p className="mt-4 text-sm text-[var(--cedro-success)]">{success}</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-[var(--cedro-error)]">{error}</p>
      )}
    </form>
  );
}
