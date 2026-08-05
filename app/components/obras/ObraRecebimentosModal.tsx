"use client";

import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarRecebimentoObraAdminAction,
  criarRecebimentoObraAdminAction,
  excluirRecebimentoObraAdminAction,
  listarRecebimentosObraAdminAction,
  type AdminActionState,
} from "@/app/actions/obras-admin";
import InputMoeda from "@/app/components/ui/InputMoeda";
import {
  btnPrimarySmClassName,
  btnSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/app/components/ui/form-styles";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ObraRecebimento } from "@/lib/obra-recebimentos";

type ObraRecebimentosModalProps = {
  obraId: string;
  obraNome: string;
  onFechar: () => void;
};

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ObraRecebimentosModal({
  obraId,
  obraNome,
  onFechar,
}: ObraRecebimentosModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [carregando, setCarregando] = useState(true);
  const [itens, setItens] = useState<ObraRecebimento[]>([]);
  const [feedback, setFeedback] = useState<AdminActionState>({});

  const [valor, setValor] = useState(0);
  const [dataRecebimento, setDataRecebimento] = useState(hojeIso());
  const [descricao, setDescricao] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState(0);
  const [editData, setEditData] = useState("");
  const [editDescricao, setEditDescricao] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const data = await listarRecebimentosObraAdminAction(obraId);
      setItens(data);
    } catch {
      setFeedback({ erro: "Não foi possível carregar os recebimentos." });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      setCarregando(true);
    });

    listarRecebimentosObraAdminAction(obraId)
      .then((data) => {
        if (!cancelled) setItens(data);
      })
      .catch(() => {
        if (!cancelled) {
          setFeedback({ erro: "Não foi possível carregar os recebimentos." });
        }
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });

    return () => {
      cancelled = true;
    };
  }, [obraId]);

  const total = itens.reduce((s, i) => s + i.valor, 0);

  function iniciarEdicao(item: ObraRecebimento) {
    setEditandoId(item.id);
    setEditValor(item.valor);
    setEditData(item.data_recebimento);
    setEditDescricao(item.descricao ?? "");
    setFeedback({});
  }

  function handleCriar(e: FormEvent) {
    e.preventDefault();
    setFeedback({});
    const fd = new FormData();
    fd.set("valor", String(valor));
    fd.set("dataRecebimento", dataRecebimento);
    fd.set("descricao", descricao);

    startTransition(async () => {
      const result = await criarRecebimentoObraAdminAction(obraId, fd);
      setFeedback(result);
      if (result.sucesso) {
        setValor(0);
        setDescricao("");
        setDataRecebimento(hojeIso());
        await carregar();
        router.refresh();
      }
    });
  }

  function handleSalvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!editandoId) return;
    setFeedback({});
    const fd = new FormData();
    fd.set("valor", String(editValor));
    fd.set("dataRecebimento", editData);
    fd.set("descricao", editDescricao);

    startTransition(async () => {
      const result = await atualizarRecebimentoObraAdminAction(editandoId, fd);
      setFeedback(result);
      if (result.sucesso) {
        setEditandoId(null);
        await carregar();
        router.refresh();
      }
    });
  }

  function handleExcluir(id: string) {
    if (!confirm("Excluir este recebimento?")) return;
    setFeedback({});
    startTransition(async () => {
      const result = await excluirRecebimentoObraAdminAction(id);
      setFeedback(result);
      if (result.sucesso) {
        if (editandoId === id) setEditandoId(null);
        await carregar();
        router.refresh();
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
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Recebimentos
            </h2>
            <p className="text-sm text-zinc-500">{obraNome}</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Total recebido:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(total)}
            </span>
          </p>

          <form
            onSubmit={handleCriar}
            className="mb-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h3 className="mb-3 text-sm font-semibold">Registrar recebimento</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClassName}>Valor</label>
                <InputMoeda
                  id="novo-valor"
                  required
                  value={valor}
                  onChange={setValor}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClassName}>Data</label>
                <input
                  type="date"
                  required
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClassName}>Descrição (opcional)</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: Parcela 1 do contrato"
                  className={inputClassName}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className={`mt-4 ${btnPrimarySmClassName}`}
            >
              {pending ? "Salvando…" : "Adicionar recebimento"}
            </button>
          </form>

          {carregando ? (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando histórico…
            </p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum recebimento registrado.</p>
          ) : (
            <ul className="space-y-3">
              {itens.map((item) =>
                editandoId === item.id ? (
                  <li
                    key={item.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <form onSubmit={handleSalvarEdicao} className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputMoeda
                          id={`edit-valor-${item.id}`}
                          required
                          value={editValor}
                          onChange={setEditValor}
                        />
                        <input
                          type="date"
                          required
                          value={editData}
                          onChange={(e) => setEditData(e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                      <input
                        type="text"
                        value={editDescricao}
                        onChange={(e) => setEditDescricao(e.target.value)}
                        className={inputClassName}
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={pending} className={btnPrimarySmClassName}>
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoId(null)}
                          className={btnSecondaryClassName}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {formatCurrency(item.valor)}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatDate(item.data_recebimento)}
                      </p>
                      {item.descricao ? (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {item.descricao}
                        </p>
                      ) : null}
                      {item.origem === "migracao" ? (
                        <p className="mt-1 text-xs text-zinc-400">Saldo migrado</p>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(item)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleExcluir(item.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}

          {feedback.erro ? (
            <p className="mt-4 text-sm text-[var(--cedro-error)]">{feedback.erro}</p>
          ) : null}
          {feedback.sucesso ? (
            <p className="mt-4 text-sm text-[var(--cedro-success)]">
              {feedback.sucesso}
            </p>
          ) : null}
        </div>

        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <button type="button" onClick={onFechar} className={btnSecondaryClassName}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
