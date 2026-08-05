import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStoragePath, NOTAS_FISCAIS_BUCKET } from "@/lib/notas-fiscais";
import { registrarEventoNotaFiscal } from "@/lib/nota-fiscal-eventos";
import { PORTAL_NOTAS_ORIGEM } from "@/lib/portal-notas/config";
import type { ArquivoPortalValidado } from "@/lib/portal-notas/validar-arquivo";

const ERRO_AUTH_USER_ID =
  "Configuração do banco incompleta (auth_user_id). Execute supabase/portal-minhas-notas-rls.sql no Supabase.";

export type SalvarNotaPortalParams = {
  obraId: string;
  arquivo: ArquivoPortalValidado;
  enviadoPorNome: string;
  funcionarioId: string;
  authUserId: string;
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
    console.error("[portal-notas] storage.upload.erro", uploadError.message);
    throw new Error(`Erro ao salvar arquivo: ${uploadError.message}`);
  }

  console.info("[portal-notas] storage.upload.ok", {
    obraId: params.obraId,
    tamanho: params.arquivo.fileSize,
  });

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
    auth_user_id: params.authUserId,
    observacoes: params.observacoes?.trim() || null,
  };

  const { data, error: insertError } = await supabase
    .from("notas_fiscais")
    .insert(insertCompleto)
    .select("id, criado_em")
    .single();

  if (insertError || !data) {
    await supabase.storage.from(NOTAS_FISCAIS_BUCKET).remove([storagePath]);
    const msg = insertError?.message ?? "";
    if (msg.includes("auth_user_id")) {
      throw new Error(ERRO_AUTH_USER_ID);
    }
    throw new Error(
      insertError?.message ?? "Erro ao registrar a nota no banco."
    );
  }

  console.info("[portal-notas] db.insert.ok", { notaId: data.id });

  await registrarEventoNotaFiscal(supabase, {
    notaId: data.id,
    acao: "enviada",
    usuarioNome: params.enviadoPorNome,
    detalhes: {
      origem: PORTAL_NOTAS_ORIGEM,
      obra_id: params.obraId,
    },
  });

  return {
    notaId: data.id,
    storagePath,
    criadoEm: data.criado_em,
  };
}
