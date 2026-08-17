"use client";

import { FormEvent, useState, useTransition } from "react";
import { X } from "lucide-react";
import type { AnotacaoActionState } from "@/app/actions/anotacoes-pessoais";
import InputMoeda from "@/app/components/ui/InputMoeda";
import {
  btnPrimarySmClassName,
  btnSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/app/components/ui/form-styles";
import {
  CATEGORIAS_ANOTACAO_SUGESTOES,
  type AnotacaoPessoalRow,
} from "@/lib/anotacoes-pessoais";

type AnotacaoModalProps = {
  modo: "criar" | "editar";
  anotacao?: AnotacaoPessoalRow;
  onFechar: () => void;
  onSalvar: (formData: FormData) => Promise<AnotacaoActionState>;
  onSucesso: () => void;
};

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AnotacaoModal({
  modo,
  anotacao,
  onFechar,
  onSalvar,
  onSucesso,
}: AnotacaoModalProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<AnotacaoActionState>({});

  const [data, setData] = useState(anotacao?.data ?? hojeIso());
  const [descricao, setDescricao] = useState(anotacao?.descricao ?? "");
  const [categoria, setCategoria] = useState(anotacao?.categoria ?? "");
  const [valor, setValor] = useState(anotacao?.valor ?? 0);
  const [observacao, setObservacao] = useState(anotacao?.observacao ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback({});

    const fd = new FormData();
    fd.set("data", data);
    fd.set("descricao", descricao);
    fd.set("categoria", categoria);
    fd.set("valor", valor > 0 ? String(valor) : "");
    fd.set("observacao", observacao);

    startTransition(async () => {
      const result = await onSalvar(fd);
      setFeedback(result);
      if (result.sucesso) {
        onSucesso();
        onFechar();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--cedro-surface)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="anotacao-modal-titulo"
      >
        <div className="flex items-center justify-between border-b border-[var(--cedro-border)] px-5 py-4">
          <h2
            id="anotacao-modal-titulo"
            className="text-lg font-semibold text-[var(--cedro-text)]"
          >
            {modo === "criar" ? "Nova anotação" : "Editar anotação"}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label htmlFor="anotacao-data" className={labelClassName}>
                Data *
              </label>
              <input
                id="anotacao-data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="anotacao-descricao" className={labelClassName}>
                Descrição *
              </label>
              <input
                id="anotacao-descricao"
                type="text"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={inputClassName}
                placeholder="Ex.: Pagamento mão de obra, Empréstimo…"
              />
            </div>

            <div>
              <label htmlFor="anotacao-categoria" className={labelClassName}>
                Categoria
              </label>
              <input
                id="anotacao-categoria"
                type="text"
                list="anotacao-categorias-sugestoes"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={inputClassName}
                placeholder="Opcional"
              />
              <datalist id="anotacao-categorias-sugestoes">
                {CATEGORIAS_ANOTACAO_SUGESTOES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="anotacao-valor" className={labelClassName}>
                Valor
              </label>
              <InputMoeda
                id="anotacao-valor"
                value={valor}
                onChange={setValor}
                placeholder="0,00"
              />
            </div>

            <div>
              <label htmlFor="anotacao-observacao" className={labelClassName}>
                Observação
              </label>
              <textarea
                id="anotacao-observacao"
                rows={3}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className={inputClassName}
                placeholder="Texto livre (opcional)"
              />
            </div>

            {feedback.erro ? (
              <p className="text-sm text-[var(--cedro-error)]">{feedback.erro}</p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--cedro-border)] px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onFechar}
              disabled={pending}
              className={btnSecondaryClassName}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className={btnPrimarySmClassName}
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
