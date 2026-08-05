"use client";

import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarGastoObraAdminAction,
} from "@/app/actions/gastos-admin";
import type { AdminActionState } from "@/app/actions/obras-admin";
import {
  btnPrimarySmClassName,
  btnSecondaryClassName,
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import InputMoeda from "@/app/components/ui/InputMoeda";
import { CATEGORIAS_GASTO, ETAPAS_GASTO } from "@/lib/gastos-opcoes";
import type { GastoObraRow } from "@/lib/gastos-obra";

type GastoEditarModalProps = {
  gasto: GastoObraRow;
  onFechar: () => void;
};

export default function GastoEditarModal({
  gasto,
  onFechar,
}: GastoEditarModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<AdminActionState>({});

  const [etapa, setEtapa] = useState(gasto.etapa);
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [descricao, setDescricao] = useState(gasto.descricao);
  const [fornecedor, setFornecedor] = useState(gasto.fornecedor ?? "");
  const [quantidade, setQuantidade] = useState(
    gasto.quantidade != null ? String(gasto.quantidade) : "1"
  );
  const [valorUnitario, setValorUnitario] = useState(
    gasto.valor_unitario ?? gasto.valor_total ?? 0
  );
  const [dataGasto, setDataGasto] = useState(gasto.data_gasto ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback({});

    const fd = new FormData();
    fd.set("etapa", etapa);
    fd.set("categoria", categoria);
    fd.set("descricao", descricao);
    fd.set("fornecedor", fornecedor);
    fd.set("quantidade", quantidade);
    fd.set("valorUnitario", String(valorUnitario));
    fd.set("dataGasto", dataGasto);

    startTransition(async () => {
      const result = await atualizarGastoObraAdminAction(gasto.id, fd);
      setFeedback(result);
      if (result.sucesso) {
        router.refresh();
        onFechar();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Editar gasto
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-etapa" className={labelClassName}>
                Etapa
              </label>
              <select
                id="edit-etapa"
                required
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className={selectClassName}
              >
                <option value="">Selecionar</option>
                {ETAPAS_GASTO.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-categoria" className={labelClassName}>
                Categoria
              </label>
              <select
                id="edit-categoria"
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={selectClassName}
              >
                <option value="">Selecionar</option>
                {CATEGORIAS_GASTO.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="edit-descricao" className={labelClassName}>
                Descrição
              </label>
              <input
                id="edit-descricao"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="edit-fornecedor" className={labelClassName}>
                Fornecedor
              </label>
              <input
                id="edit-fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-qtd" className={labelClassName}>
                Quantidade
              </label>
              <input
                id="edit-qtd"
                type="number"
                min="0"
                step="0.01"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-unit" className={labelClassName}>
                Valor unitário
              </label>
              <InputMoeda
                id="edit-unit"
                required
                value={valorUnitario}
                onChange={setValorUnitario}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-data" className={labelClassName}>
                Data
              </label>
              <input
                id="edit-data"
                type="date"
                value={dataGasto}
                onChange={(e) => setDataGasto(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          {feedback.erro ? (
            <p className="mt-4 text-sm text-[var(--cedro-error)]">{feedback.erro}</p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onFechar}
              disabled={pending}
              className={btnSecondaryClassName}
            >
              Cancelar
            </button>
            <button type="submit" disabled={pending} className={btnPrimarySmClassName}>
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </span>
              ) : (
                "Salvar alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
