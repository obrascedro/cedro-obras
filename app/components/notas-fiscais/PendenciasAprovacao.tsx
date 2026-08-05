"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  aprovarNotaFiscalAction,
  rejeitarNotaFiscalAction,
  solicitarCorrecaoNotaFiscalAction,
} from "@/app/actions/notas-fiscais-aprovacao";
import NotaFiscalCamposForm from "@/app/components/notas-fiscais/NotaFiscalCamposForm";
import NotaFiscalLeituraPreview from "@/app/components/notas-fiscais/NotaFiscalLeituraPreview";
import { formatCurrency, formatDate, parseNumber } from "@/lib/format";
import {
  criarItemVazio,
  syncItemTotal,
  type NotaFiscalItemExtraido,
} from "@/lib/nota-fiscal-ia";
import { calcularAlertasNota } from "@/lib/notas-fiscais-pendencias";
import {
  getObraNomeNota,
  formatOrigemNota,
  isPendenteAprovacao,
  NOTAS_FISCAIS_BUCKET,
  type NotaFiscal,
  type ObraOption,
} from "@/lib/notas-fiscais";
import type { PerfilNotaFiscal } from "@/lib/nota-fiscal-perfil";
import { supabase } from "@/lib/supabase";
import { salvarClassificacaoAprendida } from "@/lib/nota-fiscal-classificacao-aprendida";

type PendenciasAprovacaoProps = {
  notas: NotaFiscal[];
  obras: ObraOption[];
  perfil: PerfilNotaFiscal;
  usuarioNome: string;
};

function parseItens(nota: NotaFiscal): NotaFiscalItemExtraido[] {
  if (!Array.isArray(nota.itens_json)) return [];
  return (nota.itens_json as NotaFiscalItemExtraido[]).map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
  }));
}

export default function PendenciasAprovacao({
  notas,
  obras,
  perfil,
  usuarioNome,
}: PendenciasAprovacaoProps) {
  const router = useRouter();
  const pendencias = useMemo(
    () => notas.filter((n) => isPendenteAprovacao(n.status_processamento)),
    [notas]
  );

  const [notaAberta, setNotaAberta] = useState<NotaFiscal | null>(null);
  const [obraId, setObraId] = useState("");
  const [dataNota, setDataNota] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [valorInformado, setValorInformado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<NotaFiscalItemExtraido[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  if (perfil !== "aprovador") return null;

  function abrirNota(nota: NotaFiscal) {
    setNotaAberta(nota);
    setObraId(nota.obra_id);
    setDataNota(nota.data_nota ?? "");
    setFornecedor(nota.fornecedor ?? "");
    setValorInformado(
      nota.valor_total != null ? String(nota.valor_total) : ""
    );
    setObservacoes(nota.observacoes ?? "");
    setItens(parseItens(nota).length > 0 ? parseItens(nota) : [criarItemVazio()]);
    setErro("");
    setSucesso("");

    const leitura = nota.leitura_json as { cnpj?: string } | null;
    setCnpj(typeof leitura?.cnpj === "string" ? leitura.cnpj : "");
  }

  function fecharNota() {
    setNotaAberta(null);
  }

  function handleItemChange(
    id: string,
    field: keyof NotaFiscalItemExtraido,
    value: string | number | boolean
  ) {
    setItens((current) =>
      current.map((item) =>
        item.id === id ? syncItemTotal(item, field, value) : item
      )
    );
  }

  async function handleAprovar() {
    if (!notaAberta) return;
    setLoading(true);
    setErro("");
    setSucesso("");

    const valorTotal =
      parseNumber(valorInformado) ||
      itens.reduce((s, i) => s + i.valor_total, 0);

    try {
      await aprovarNotaFiscalAction({
        notaId: notaAberta.id,
        obraId,
        fornecedor,
        cnpj,
        dataNota,
        valorTotal,
        observacoes,
        itens,
        aprovadorNome: usuarioNome,
        perfil,
      });

      for (const item of itens) {
        if (item.revisado_pelo_usuario && item.descricao.trim()) {
          try {
            await salvarClassificacaoAprendida(
              item.descricao,
              item.categoria,
              item.etapa
            );
          } catch {
            // silencioso
          }
        }
      }

      setSucesso("Nota aprovada e gastos lançados.");
      fecharNota();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao aprovar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRejeitar() {
    if (!notaAberta) return;
    const motivo = window.prompt("Motivo da rejeição:");
    if (!motivo?.trim()) return;

    setLoading(true);
    setErro("");
    try {
      await rejeitarNotaFiscalAction({
        notaId: notaAberta.id,
        motivo,
        rejeitadoPorNome: usuarioNome,
        perfil,
      });
      fecharNota();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao rejeitar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSolicitarCorrecao() {
    if (!notaAberta) return;
    const mensagem = window.prompt("Mensagem para o funcionário:");
    if (!mensagem?.trim()) return;

    setLoading(true);
    setErro("");
    try {
      await solicitarCorrecaoNotaFiscalAction({
        notaId: notaAberta.id,
        mensagem,
        solicitadoPorNome: usuarioNome,
        perfil,
      });
      fecharNota();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao solicitar correção.");
    } finally {
      setLoading(false);
    }
  }

  async function abrirArquivo(nota: NotaFiscal) {
    const { data } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .createSignedUrl(nota.arquivo_path, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  }

  const alertasAberta = notaAberta
    ? calcularAlertasNota(parseNumber(valorInformado), itens)
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/50 dark:bg-zinc-900">
      <div className="border-b border-amber-200/80 bg-amber-50/50 px-6 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Pendências para aprovação
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {pendencias.length} nota(s) aguardando conferência do aprovador.
        </p>
      </div>

      {pendencias.length === 0 ? (
        <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
          Nenhuma nota pendente de aprovação.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {pendencias.map((nota) => {
            const itensNota = parseItens(nota);
            const alertas = calcularAlertasNota(nota.valor_total ?? 0, itensNota);
            return (
              <li
                key={nota.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {nota.fornecedor ?? "Sem fornecedor"} —{" "}
                    {formatCurrency(nota.valor_total ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {getObraNomeNota(nota.obras)} ·{" "}
                    {formatOrigemNota(nota.origem)} ·{" "}
                    {new Date(nota.criado_em).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Enviado por: {nota.enviado_por_nome ?? "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {alertas.divergenciaValor ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        Divergência de valor
                      </span>
                    ) : null}
                    {alertas.baixaConfianca > 0 ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                        {alertas.baixaConfianca} item(ns) baixa confiança
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void abrirArquivo(nota)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Ver arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirNota(nota)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Conferir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {notaAberta ? (
        <div className="border-t border-zinc-200 p-6 dark:border-zinc-800">
          <NotaFiscalCamposForm
            obras={obras}
            obraId={obraId}
            onObraIdChange={setObraId}
            dataNota={dataNota}
            onDataNotaChange={setDataNota}
            fornecedor={fornecedor}
            onFornecedorChange={setFornecedor}
            cnpj={cnpj}
            onCnpjChange={setCnpj}
            showCnpj
            valorInformado={valorInformado}
            onValorInformadoChange={setValorInformado}
            observacoes={observacoes}
            onObservacoesChange={setObservacoes}
          />

          <NotaFiscalLeituraPreview
            variant="aprovador"
            itens={itens}
            onItemChange={handleItemChange}
            onRemoveItem={(id) =>
              setItens((c) => c.filter((i) => i.id !== id))
            }
            onAddItem={() => setItens((c) => [...c, criarItemVazio()])}
            onConfirm={handleAprovar}
            onCancel={fecharNota}
            onReject={handleRejeitar}
            onRequestCorrection={handleSolicitarCorrecao}
            loading={loading}
            totalItens={itens.reduce((s, i) => s + i.valor_total, 0)}
            valorTotalNota={parseNumber(valorInformado) || undefined}
            alertas={
              alertasAberta
                ? {
                    divergenciaValor: alertasAberta.divergenciaValor,
                    diferencaValor: alertasAberta.diferencaValor,
                    somaItens: itens.reduce((s, i) => s + i.valor_total, 0),
                    valorNota: parseNumber(valorInformado),
                    mensagens: [],
                  }
                : null
            }
          />

          {erro ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>
          ) : null}
          {sucesso ? (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              {sucesso}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
