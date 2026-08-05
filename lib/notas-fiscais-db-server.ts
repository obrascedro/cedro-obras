import type { SupabaseClient } from "@supabase/supabase-js";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import {
  montarObservacoesNota,
  type NotaFiscalItemExtraido,
  type NotaFiscalLeitura,
} from "@/lib/nota-fiscal-ia";
import { registrarEventoNotaFiscal } from "@/lib/nota-fiscal-eventos";
import { STATUS_PENDENTE_APROVACAO } from "@/lib/notas-fiscais-status";

export type AtualizarNotaAposLeituraParams = {
  notaId: string;
  fornecedor: string;
  cnpj: string;
  dataNota: string;
  valorTotal: number;
  observacoes?: string;
  leitura?: NotaFiscalLeitura;
  enviadoPorNome?: string;
};

export async function atualizarStatusNotaFiscalServer(
  supabase: SupabaseClient,
  notaId: string,
  status: string,
  extra?: Record<string, unknown>
) {
  logNotaFiscal("supabase.update.status.inicio", { notaId, status });

  const { data, error } = await supabase
    .from("notas_fiscais")
    .update({ status_processamento: status, ...extra })
    .eq("id", notaId)
    .select("id, status_processamento");

  if (error) {
    logNotaFiscalError("supabase.update.status.erro", error, { notaId, status });
    throw new Error(
      `Falha ao atualizar status para "${status}": ${error.message}`
    );
  }

  if (!data || data.length === 0) {
    const message =
      `Nenhuma linha atualizada ao mudar status para "${status}". ` +
      "Verifique a política UPDATE de notas_fiscais no Supabase.";
    logNotaFiscal("supabase.update.status.sem_linhas", { notaId, status }, "error");
    throw new Error(message);
  }

  logNotaFiscal("supabase.update.status.sucesso", {
    notaId,
    status: data[0]?.status_processamento,
  });
}

export async function atualizarNotaAposLeituraServer(
  supabase: SupabaseClient,
  params: AtualizarNotaAposLeituraParams
) {
  logNotaFiscal("supabase.update.leitura.inicio", {
    notaId: params.notaId,
    fornecedor: params.fornecedor,
    valorTotal: params.valorTotal,
  });

  const leituraJson = params.leitura
    ? {
        fornecedor: params.leitura.fornecedor,
        cnpj: params.leitura.cnpj,
        data: params.leitura.data,
        valor_total: params.leitura.valor_total,
      }
    : null;

  const itensJson: NotaFiscalItemExtraido[] | null =
    params.leitura?.itens ?? null;

  const extraCompleto = {
    fornecedor: params.fornecedor.trim() || null,
    data_nota: params.dataNota || null,
    valor_total: params.valorTotal || null,
    observacoes: montarObservacoesNota(params.cnpj, params.observacoes ?? ""),
    leitura_json: leituraJson,
    itens_json: itensJson,
    enviado_por_nome: params.enviadoPorNome?.trim() || null,
  };

  const extraBasico = {
    fornecedor: extraCompleto.fornecedor,
    data_nota: extraCompleto.data_nota,
    valor_total: extraCompleto.valor_total,
    observacoes: extraCompleto.observacoes,
  };

  try {
    await atualizarStatusNotaFiscalServer(
      supabase,
      params.notaId,
      STATUS_PENDENTE_APROVACAO,
      extraCompleto
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const schemaAntigo =
      message.includes("leitura_json") ||
      message.includes("itens_json") ||
      message.includes("enviado_por_nome") ||
      message.includes("schema cache");

    if (!schemaAntigo) throw error;

    logNotaFiscal(
      "supabase.update.leitura.schema_legado",
      { notaId: params.notaId },
      "warn"
    );

    await atualizarStatusNotaFiscalServer(
      supabase,
      params.notaId,
      STATUS_PENDENTE_APROVACAO,
      extraBasico
    );
  }

  await registrarEventoNotaFiscal(supabase, {
    notaId: params.notaId,
    acao: "processada_ia",
    usuarioNome: params.enviadoPorNome,
    detalhes: {
      totalItens: itensJson?.length ?? 0,
      valorTotal: params.valorTotal,
    },
  });

  logNotaFiscal("supabase.update.leitura.sucesso", {
    notaId: params.notaId,
    status: STATUS_PENDENTE_APROVACAO,
  });
}

export async function marcarNotaFiscalErroServer(
  supabase: SupabaseClient,
  notaId: string,
  detalhe?: string
) {
  logNotaFiscal("supabase.update.erro.inicio", { notaId, detalhe }, "warn");

  try {
    await atualizarStatusNotaFiscalServer(supabase, notaId, "erro", {
      observacoes: detalhe ? `Erro IA: ${detalhe}` : null,
    });
  } catch (error) {
    logNotaFiscalError("supabase.update.erro.falhou", error, { notaId });
  }
}
