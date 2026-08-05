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
  storageDisponivel?: boolean;
};

export default function EngenheiroCedroClient({
  obras,
  conversasIniciais,
  storageDisponivel = true,
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

          const lista = storageDisponivel
            ? await listarConversasEngenheiroCedro()
            : [];
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
    [conversaId, isPending, obraId, storageDisponivel]
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
        <div className="cedro-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cedro-text)]">
              Conversas
            </h2>
            <button
              type="button"
              onClick={novaConversa}
              className="text-xs font-medium text-[var(--cedro-brown)] hover:text-[var(--cedro-brown-hover)]"
            >
              + Nova
            </button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto lg:max-h-[28rem]">
            {conversas.length === 0 ? (
              <li className="text-xs text-[var(--cedro-text-muted)]">
                {storageDisponivel
                  ? "Nenhuma conversa ainda."
                  : "Histórico indisponível até configurar o banco."}
              </li>
            ) : (
              conversas.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void carregarConversa(c.id)}
                    className={`group flex w-full items-start justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                      conversaId === c.id
                        ? "bg-[var(--cedro-bg)]"
                        : "hover:bg-[var(--cedro-bg)]"
                    }`}
                  >
                    <span className="line-clamp-2 flex-1 text-[var(--cedro-text)]">
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
                      className="ml-1 hidden shrink-0 text-[var(--cedro-text-muted)] group-hover:inline hover:text-[var(--cedro-error)]"
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
          <div className="mt-4 cedro-card p-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--cedro-text-muted)]">
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
      <div className="cedro-card flex min-h-[32rem] flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {mostrarBoasVindas ? (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgb(138_46_31/0.1)] text-[var(--cedro-brown)]">
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
              <h2 className="text-xl font-semibold text-[var(--cedro-text)]">
                Olá, sou o Engenheiro Cedro.
              </h2>
              <p className="mt-2 text-sm text-[var(--cedro-text-muted)]">
                Posso responder perguntas sobre suas obras, gastos, fornecedores,
                orçamentos e notas fiscais — com dados reais do sistema.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGESTOES_ENGENHEIRO_CEDRO.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => storageDisponivel && enviar(sugestao)}
                    disabled={!storageDisponivel || isPending}
                    className="rounded-full border border-[var(--cedro-border)] px-3 py-1.5 text-xs text-[var(--cedro-text)] transition-colors hover:bg-[var(--cedro-bg)] disabled:cursor-not-allowed disabled:opacity-50"
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
                  <div className="rounded-2xl border border-[var(--cedro-border)] bg-[var(--cedro-bg)] px-4 py-3 text-sm text-[var(--cedro-text-muted)]">
                    Analisando dados das obras…
                  </div>
                </div>
              ) : null}
              <div ref={fimRef} />
            </div>
          )}
        </div>

        {erro ? (
          <div className="mx-4 mb-2 rounded-xl border border-[var(--cedro-error)]/12 bg-[var(--cedro-error-bg)] px-3 py-2 text-sm text-[var(--cedro-error)]">
            {erro}
            {erro.includes("assistente") || erro.includes("relation") ? (
              <p className="mt-1 text-xs">
                Execute{" "}
                <code className="rounded bg-[var(--cedro-error-bg)] px-1">
                  supabase/assistente-conversas.sql
                </code>{" "}
                no Supabase.
              </p>
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="border-t border-[var(--cedro-border)] p-4"
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
              disabled={isPending || !pergunta.trim() || !storageDisponivel}
              className="cedro-btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
