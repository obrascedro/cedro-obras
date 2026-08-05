import { supabase } from "@/lib/supabase";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import { montarObservacoesNota } from "@/lib/nota-fiscal-ia";

export type AtualizarNotaAposLeituraParams = {
  notaId: string;
  fornecedor: string;
  cnpj: string;
  dataNota: string;
  valorTotal: number;
  observacoes?: string;
};

export async function criarNotaFiscalProcessando(params: {
  obraId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
}) {
  logNotaFiscal("supabase.insert.inicio", {
    obraId: params.obraId,
    storagePath: params.storagePath,
  });

  const { data, error } = await supabase
    .from("notas_fiscais")
    .insert({
      obra_id: params.obraId,
      arquivo_path: params.storagePath,
      arquivo_nome: params.fileName,
      arquivo_tipo: params.mimeType,
      arquivo_tamanho: params.fileSize,
      origem: "ia",
      status_processamento: "processando",
    })
    .select("id")
    .single();

  if (error || !data) {
    logNotaFiscalError("supabase.insert.erro", error ?? "Sem dados retornados", {
      obraId: params.obraId,
    });
    throw new Error(error?.message ?? "Erro ao registrar a nota fiscal.");
  }

  logNotaFiscal("supabase.insert.sucesso", { notaId: data.id });
  return data.id as string;
}

export async function atualizarStatusNotaFiscal(
  notaId: string,
  status: string,
  extra?: Record<string, unknown>
) {
  logNotaFiscal("supabase.update.status.inicio", { notaId, status, extra });

  const { data, error } = await supabase
    .from("notas_fiscais")
    .update({ status_processamento: status, ...extra })
    .eq("id", notaId)
    .select("id, status_processamento");

  if (error) {
    logNotaFiscalError("supabase.update.status.erro", error, { notaId, status });
    throw new Error(
      `Falha ao atualizar status para "${status}": ${error.message}. ` +
        "Verifique se a política UPDATE de notas_fiscais está aplicada no Supabase."
    );
  }

  if (!data || data.length === 0) {
    const message =
      `Nenhuma linha atualizada ao mudar status para "${status}". ` +
      "Provável bloqueio de RLS (política UPDATE ausente no Supabase).";
    logNotaFiscal("supabase.update.status.sem_linhas", { notaId, status }, "error");
    throw new Error(message);
  }

  logNotaFiscal("supabase.update.status.sucesso", {
    notaId,
    status: data[0]?.status_processamento,
  });
}

export async function atualizarNotaAposLeitura({
  notaId,
  fornecedor,
  cnpj,
  dataNota,
  valorTotal,
  observacoes,
}: AtualizarNotaAposLeituraParams) {
  logNotaFiscal("supabase.update.leitura.inicio", { notaId, fornecedor, valorTotal });

  await atualizarStatusNotaFiscal(notaId, "pendente_aprovacao", {
    fornecedor: fornecedor.trim() || null,
    data_nota: dataNota || null,
    valor_total: valorTotal || null,
    observacoes: montarObservacoesNota(cnpj, observacoes ?? ""),
  });

  logNotaFiscal("supabase.update.leitura.sucesso", { notaId });
}

export async function marcarNotaFiscalErro(notaId: string, detalhe?: string) {
  logNotaFiscal("supabase.update.erro.inicio", { notaId, detalhe }, "warn");

  try {
    await atualizarStatusNotaFiscal(notaId, "erro", {
      observacoes: detalhe ? `Erro IA: ${detalhe}` : null,
    });
  } catch (error) {
    logNotaFiscalError("supabase.update.erro.falhou", error, { notaId });
  }
}
