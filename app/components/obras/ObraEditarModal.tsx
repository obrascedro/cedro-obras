"use client";

import { Loader2, X } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarObraAdminAction,
  type AdminActionState,
} from "@/app/actions/obras-admin";
import InputMoeda from "@/app/components/ui/InputMoeda";
import {
  btnPrimarySmClassName,
  btnSecondaryClassName,
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import { STATUS_OBRA } from "@/lib/obras-constants";

export type ObraEditarDados = {
  id: string;
  nome: string;
  clienteId: string;
  status: string;
  orcamentoPrevisto: number;
  dataInicio: string;
  dataPrevisaoTermino: string;
  areaM2: number | null;
  observacoes: string;
};

type ClienteOption = { id: string; nome: string };

type ObraEditarModalProps = {
  obra: ObraEditarDados;
  clientes: ClienteOption[];
  onFechar: () => void;
};

export default function ObraEditarModal({
  obra,
  clientes,
  onFechar,
}: ObraEditarModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<AdminActionState>({});

  const [clienteId, setClienteId] = useState(obra.clienteId);
  const [nome, setNome] = useState(obra.nome);
  const [status, setStatus] = useState(obra.status);
  const [orcamentoPrevisto, setOrcamentoPrevisto] = useState(
    obra.orcamentoPrevisto
  );
  const [dataInicio, setDataInicio] = useState(obra.dataInicio);
  const [dataPrevisaoTermino, setDataPrevisaoTermino] = useState(
    obra.dataPrevisaoTermino
  );
  const [areaM2, setAreaM2] = useState(
    obra.areaM2 != null ? String(obra.areaM2) : ""
  );
  const [observacoes, setObservacoes] = useState(obra.observacoes);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback({});

    const fd = new FormData();
    fd.set("clienteId", clienteId);
    fd.set("nome", nome);
    fd.set("status", status);
    fd.set("orcamentoPrevisto", String(orcamentoPrevisto));
    fd.set("dataInicio", dataInicio);
    fd.set("dataPrevistaTermino", dataPrevisaoTermino);
    fd.set("areaM2", areaM2);
    fd.set("observacoes", observacoes);

    startTransition(async () => {
      const result = await atualizarObraAdminAction(obra.id, fd);
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
            Editar dados da obra
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
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="edit-nome" className={labelClassName}>
                Nome da obra
              </label>
              <input
                id="edit-nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="edit-cliente" className={labelClassName}>
                Cliente
              </label>
              <select
                id="edit-cliente"
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className={selectClassName}
              >
                <option value="">Selecionar cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-status" className={labelClassName}>
                Status
              </label>
              <select
                id="edit-status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectClassName}
              >
                {STATUS_OBRA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-area" className={labelClassName}>
                Área em m²
              </label>
              <input
                id="edit-area"
                type="number"
                min="0"
                step="0.01"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-orcamento" className={labelClassName}>
                Orçamento previsto
              </label>
              <InputMoeda
                id="edit-orcamento"
                required
                value={orcamentoPrevisto}
                onChange={setOrcamentoPrevisto}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-inicio" className={labelClassName}>
                Data de início
              </label>
              <input
                id="edit-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-termino" className={labelClassName}>
                Previsão de término
              </label>
              <input
                id="edit-termino"
                type="date"
                value={dataPrevisaoTermino}
                onChange={(e) => setDataPrevisaoTermino(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="edit-obs" className={labelClassName}>
                Observações
              </label>
              <textarea
                id="edit-obs"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className={`${inputClassName} resize-y`}
              />
            </div>
          </div>

          {feedback.erro ? (
            <p className="mt-4 text-sm text-[var(--cedro-error)]">{feedback.erro}</p>
          ) : null}
          {feedback.sucesso ? (
            <p className="mt-4 text-sm text-[var(--cedro-success)]">
              {feedback.sucesso}
            </p>
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
