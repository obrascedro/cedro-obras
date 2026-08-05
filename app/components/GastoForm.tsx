"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatCurrency, parseNumber } from "@/lib/format";
import { recalcularGastoRealizado } from "@/lib/gastos-obra";
import {
  inputClassName,
  labelClassName,
} from "@/app/components/ui/form-styles";

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

    const { error: insertError } = await supabase.from("gastos_obra").insert({
      obra_id: obraId,
      etapa,
      categoria,
      descricao,
      fornecedor: fornecedor.trim() || null,
      quantidade: parseNumber(quantidade),
      valor_unitario: parseNumber(valorUnitario),
      valor_total: valorTotal,
      data_gasto: dataGasto || null,
    });

    if (insertError) {
      setLoading(false);
      setError(insertError.message);
      return;
    }

    try {
      await recalcularGastoRealizado(obraId);
    } catch (recalcError) {
      setLoading(false);
      setError(
        recalcError instanceof Error
          ? recalcError.message
          : "Erro ao atualizar o gasto realizado da obra."
      );
      return;
    }

    setLoading(false);
    setSuccess("Gasto cadastrado com sucesso");
    router.refresh();
    onSuccess?.();

    setEtapa("");
    setCategoria("");
    setDescricao("");
    setFornecedor("");
    setQuantidade("");
    setValorUnitario("");
    setDataGasto("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Novo gasto
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="etapa" className={labelClassName}>
            Etapa
          </label>
          <input
            id="etapa"
            type="text"
            required
            value={etapa}
            onChange={(event) => setEtapa(event.target.value)}
            placeholder="Ex.: Fundação"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className={labelClassName}>
            Categoria
          </label>
          <input
            id="categoria"
            type="text"
            required
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            placeholder="Ex.: Material"
            className={inputClassName}
          />
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
            className="flex min-h-[42px] items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            {formatCurrency(valorTotal)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
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

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:justify-end dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Salvando..." : "Salvar gasto"}
        </button>
      </div>

      {success && (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">{success}</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
