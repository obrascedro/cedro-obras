"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  carregarMensagensConversa,
  criarConversaEngenheiroCedro,
  enviarMensagemEngenheiroCedro,
  excluirConversaEngenheiroCedro,
  listarConversasEngenheiroCedro,
} from "@/app/actions/engenheiro-cedro";
import EngenheiroCedroMessage from "@/app/components/engenheiro-cedro/EngenheiroCedroMessage";
import { inputClassName, selectClassName } from "@/app/components/ui/form-styles";
import type {
  ConversaAssistente,
  MensagemAssistente,
} from "@/lib/engenheiro-cedro-types";
import { SUGESTOES_ENGENHEIRO_CEDRO } from "@/lib/engenheiro-cedro-types";

type ObraOption = { id: string; nome: string };

type EngenheiroCedroClientProps = {
  obras: ObraOption[];
  conversasIniciais: ConversaAssistente[];
};

export default function EngenheiroCedroClient({
  obras,
  conversasIniciais,
}: EngenheiroCedroClientProps) {
  const [conversas, setConversas] = useState(conversasIniciais);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<MensagemAssistente[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [obraId, setObraId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  const scrollParaFim = useCallback(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollParaFim();
  }, [mensagens, isPending, scrollParaFim]);

  const carregarConversa = useCallback(async (id: string) => {
    setConversaId(id);
    setErro(null);
    const msgs = await carregarMensagensConversa(id);
    setMensagens(msgs);
  }, []);

  const novaConversa = useCallback(() => {
    setConversaId(null);
    setMensagens([]);
    setPergunta("");
    setErro(null);
  }, []);

  const enviar = useCallback(
    (texto: string) => {
      const perguntaLimpa = texto.trim();
      if (!perguntaLimpa || isPending) return;

      setErro(null);
      setPergunta("");

      const tempUser: MensagemAssistente = {
        id: `temp-${Date.now()}`,
        role: "user",
        conteudo: perguntaLimpa,
        criado_em: new Date().toISOString(),
      };
      setMensagens((prev) => [...prev, tempUser]);

      startTransition(async () => {
        try {
          const resultado = await enviarMensagemEngenheiroCedro(
            perguntaLimpa,
            conversaId,
            obraId || null
          );

          setConversaId(resultado.conversaId);
          setMensagens((prev) => {
            const semTemp = prev.filter((m) => !m.id.startsWith("temp-"));
            return [
              ...semTemp,
              resultado.mensagemUsuario,
              resultado.mensagemAssistente,
            ];
          });

          const lista = await listarConversasEngenheiroCedro();
          setConversas(lista);
        } catch (e) {
          setErro(
            e instanceof Error ? e.message : "Erro ao processar pergunta."
          );
          setMensagens((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
          setPergunta(perguntaLimpa);
        }
      });
    },
    [conversaId, isPending, obraId]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    enviar(pergunta);
  };

  const handleExcluirConversa = async (id: string) => {
    const ok = await excluirConversaEngenheiroCedro(id);
    if (ok) {
      setConversas((prev) => prev.filter((c) => c.id !== id));
      if (conversaId === id) novaConversa();
    }
  };

  const mostrarBoasVindas = mensagens.length === 0 && !isPending;

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 lg:flex-row">
      {/* Histórico */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Conversas
            </h2>
            <button
              type="button"
              onClick={novaConversa}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              + Nova
            </button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto lg:max-h-[28rem]">
            {conversas.length === 0 ? (
              <li className="text-xs text-zinc-500 dark:text-zinc-400">
                Nenhuma conversa ainda.
              </li>
            ) : (
              conversas.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void carregarConversa(c.id)}
                    className={`group flex w-full items-start justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                      conversaId === c.id
                        ? "bg-zinc-100 dark:bg-zinc-800"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="line-clamp-2 flex-1 text-zinc-700 dark:text-zinc-300">
                      {c.titulo ?? "Conversa"}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleExcluirConversa(c.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          void handleExcluirConversa(c.id);
                        }
                      }}
                      className="ml-1 hidden shrink-0 text-zinc-400 group-hover:inline hover:text-red-500"
                      aria-label="Excluir conversa"
                    >
                      ×
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {obras.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Obra em foco (opcional)
            </label>
            <select
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className={`${selectClassName} w-full text-sm`}
            >
              <option value="">Todas as obras</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </aside>

      {/* Chat principal */}
      <div className="flex min-h-[32rem] flex-1 flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {mostrarBoasVindas ? (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l2.5 7.5H22l-6 4.5 2.5 7.5L12 18l-6.5 4.5 2.5-7.5-6-4.5h7.5L12 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Olá, sou o Engenheiro Cedro.
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Posso responder perguntas sobre suas obras, gastos, fornecedores,
                orçamentos e notas fiscais — com dados reais do sistema.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGESTOES_ENGENHEIRO_CEDRO.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => enviar(sugestao)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {mensagens.map((msg) => (
                <EngenheiroCedroMessage key={msg.id} mensagem={msg} />
              ))}
              {isPending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    Analisando dados das obras…
                  </div>
                </div>
              ) : null}
              <div ref={fimRef} />
            </div>
          )}
        </div>

        {erro ? (
          <div className="mx-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {erro}
            {erro.includes("assistente") || erro.includes("relation") ? (
              <p className="mt-1 text-xs">
                Execute{" "}
                <code className="rounded bg-red-100 px-1 dark:bg-red-950">
                  supabase/assistente-conversas.sql
                </code>{" "}
                no Supabase.
              </p>
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="border-t border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="mx-auto flex max-w-3xl gap-2">
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder="Faça uma pergunta sobre suas obras…"
              disabled={isPending}
              className={`${inputClassName} flex-1`}
            />
            <button
              type="submit"
              disabled={isPending || !pergunta.trim()}
              className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
