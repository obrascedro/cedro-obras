import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStoragePath,
  NOTAS_FISCAIS_BUCKET,
} from "@/lib/notas-fiscais";
import { registrarEventoNotaFiscal } from "@/lib/nota-fiscal-eventos";
import { PORTAL_NOTAS_ORIGEM } from "@/lib/portal-notas/config";
import type { ArquivoPortalValidado } from "@/lib/portal-notas/validar-arquivo";

export type SalvarNotaPortalParams = {
  obraId: string;
  arquivo: ArquivoPortalValidado;
  enviadoPorNome: string;
  funcionarioId: string;
  observacoes?: string;
};

export type SalvarNotaPortalResultado = {
  notaId: string;
  storagePath: string;
  criadoEm: string;
};

export async function salvarNotaPortalNoStorage(
  supabase: SupabaseClient,
  params: SalvarNotaPortalParams
): Promise<SalvarNotaPortalResultado> {
  const storagePath = buildStoragePath(params.obraId, params.arquivo.fileName);

  const { error: uploadError } = await supabase.storage
    .from(NOTAS_FISCAIS_BUCKET)
    .upload(storagePath, params.arquivo.buffer, {
      contentType: params.arquivo.mimeType,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Erro ao salvar arquivo: ${uploadError.message}`);
  }

  const insertCompleto = {
    obra_id: params.obraId,
    arquivo_path: storagePath,
    arquivo_nome: params.arquivo.fileName,
    arquivo_tipo: params.arquivo.mimeType,
    arquivo_tamanho: params.arquivo.fileSize,
    origem: PORTAL_NOTAS_ORIGEM,
    status_processamento: "aguardando",
    enviado_por_nome: params.enviadoPorNome,
    enviado_por: params.funcionarioId,
    funcionario_id: params.funcionarioId,
    observacoes: params.observacoes?.trim() || null,
  };

  const insertBasico = {
    obra_id: params.obraId,
    arquivo_path: storagePath,
    arquivo_nome: params.arquivo.fileName,
    arquivo_tipo: params.arquivo.mimeType,
    arquivo_tamanho: params.arquivo.fileSize,
    origem: PORTAL_NOTAS_ORIGEM,
    status_processamento: "aguardando",
    enviado_por_nome: params.enviadoPorNome,
    observacoes: params.observacoes?.trim() || null,
  };

  let data: { id: string; criado_em: string } | null = null;
  let insertError: { message: string; code?: string } | null = null;

  ({ data, error: insertError } = await supabase
    .from("notas_fiscais")
    .insert(insertCompleto)
    .select("id, criado_em")
    .single());

  if (
    insertError?.code === "PGRST204" ||
    insertError?.message.includes("funcionario_id")
  ) {
    ({ data, error: insertError } = await supabase
      .from("notas_fiscais")
      .insert(insertBasico)
      .select("id, criado_em")
      .single());
  }

  if (insertError || !data) {
    await supabase.storage.from(NOTAS_FISCAIS_BUCKET).remove([storagePath]);
    throw new Error(insertError?.message ?? "Erro ao registrar a nota.");
  }

  await registrarEventoNotaFiscal(supabase, {
    notaId: data.id,
    acao: "enviada",
    usuarioNome: params.enviadoPorNome,
    detalhes: {
      origem: PORTAL_NOTAS_ORIGEM,
      funcionarioId: params.funcionarioId,
    },
  });

  return {
    notaId: data.id,
    storagePath,
    criadoEm: data.criado_em,
  };
}
