import type { SupabaseClient } from "@supabase/supabase-js";
import { lerNotaFiscalComOpenAI } from "@/lib/openai-nota-fiscal";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import { validarLeituraNotaFiscal } from "@/lib/nota-fiscal-validacao";
import {
  atualizarNotaAposLeituraServer,
  marcarNotaFiscalErroServer,
} from "@/lib/notas-fiscais-db-server";
import { carregarClassificacoesAprendidas } from "@/lib/nota-fiscal-classificacao-aprendida";
import { obterEstatisticasCatalogo } from "@/lib/nota-fiscal-catalogo";
import { NOTAS_FISCAIS_BUCKET } from "@/lib/notas-fiscais";
import type { AlertasLeitura } from "@/lib/nota-fiscal-validacao";
import type { NotaFiscalLeitura } from "@/lib/nota-fiscal-ia";

export type ProcessarNotaFiscalParams = {
  storagePath: string;
  mimeType: string;
  fileName: string;
  notaId: string;
  observacoes?: string;
  enviadoPorNome?: string;
};

export type ProcessarNotaFiscalResultado = {
  leitura: NotaFiscalLeitura;
  alertas: AlertasLeitura;
};

/**
 * Pipeline único de leitura IA — reutilizado pelo site e pelo WhatsApp.
 */
export async function processarNotaFiscalComIA(
  supabase: SupabaseClient,
  params: ProcessarNotaFiscalParams
): Promise<ProcessarNotaFiscalResultado> {
  const inicio = Date.now();
  const { storagePath, mimeType, fileName, notaId, observacoes, enviadoPorNome } =
    params;

  logNotaFiscal("pipeline.inicio", { storagePath, mimeType, fileName, notaId });

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(NOTAS_FISCAIS_BUCKET)
    .download(storagePath);

  if (downloadError || !fileData) {
    logNotaFiscalError("pipeline.download.erro", downloadError, { storagePath });
    await marcarNotaFiscalErroServer(
      supabase,
      notaId,
      downloadError?.message ?? "Arquivo não encontrado no storage."
    );
    throw new Error(
      downloadError?.message ?? "Arquivo não encontrado no storage."
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  const aprendidas = await carregarClassificacoesAprendidas(supabase);
  const catalogoStats = obterEstatisticasCatalogo();

  logNotaFiscal("pipeline.classificacao.contexto", {
    aprendidas: aprendidas.size,
    catalogo: catalogoStats.totalEntradas,
  });

  const leitura = await lerNotaFiscalComOpenAI(
    {
      mimeType,
      fileName,
      base64: buffer.toString("base64"),
    },
    { aprendidas }
  );

  const alertas = validarLeituraNotaFiscal(leitura);

  await atualizarNotaAposLeituraServer(supabase, {
    notaId,
    fornecedor: leitura.fornecedor,
    cnpj: leitura.cnpj,
    dataNota: leitura.data,
    valorTotal: leitura.valor_total,
    observacoes,
    leitura,
    enviadoPorNome,
  });

  logNotaFiscal("pipeline.sucesso", {
    duracaoMs: Date.now() - inicio,
    notaId,
    totalItens: leitura.itens.length,
    status: "pendente_aprovacao",
  });

  return { leitura, alertas };
}
