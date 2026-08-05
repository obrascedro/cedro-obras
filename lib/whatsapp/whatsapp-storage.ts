import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStoragePath,
  NOTAS_FISCAIS_BUCKET,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
} from "@/lib/notas-fiscais";
import { registrarEventoNotaFiscal } from "@/lib/nota-fiscal-eventos";

export type SalvarNotaWhatsAppParams = {
  obraId: string;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  enviadoPorNome: string;
  whatsappFrom: string;
  whatsappMessageId: string;
  caption?: string;
};

export type SalvarNotaWhatsAppResultado = {
  notaId: string;
  storagePath: string;
};

export async function salvarNotaWhatsAppNoStorage(
  supabase: SupabaseClient,
  params: SalvarNotaWhatsAppParams
): Promise<SalvarNotaWhatsAppResultado> {
  if (params.buffer.length > NOTAS_FISCAIS_MAX_SIZE_BYTES) {
    throw new Error("Arquivo excede o limite de 10 MB.");
  }

  const storagePath = buildStoragePath(params.obraId, params.fileName);

  const { error: uploadError } = await supabase.storage
    .from(NOTAS_FISCAIS_BUCKET)
    .upload(storagePath, params.buffer, {
      contentType: params.mimeType,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Erro ao salvar no storage: ${uploadError.message}`);
  }

  const observacoes = [
    `WhatsApp: ${params.whatsappFrom}`,
    `Msg ID: ${params.whatsappMessageId}`,
    params.enviadoPorNome ? `Enviado por: ${params.enviadoPorNome}` : null,
    params.caption?.trim() ? `Legenda: ${params.caption.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const insertBase = {
    obra_id: params.obraId,
    arquivo_path: storagePath,
    arquivo_nome: params.fileName,
    arquivo_tipo: params.mimeType,
    arquivo_tamanho: params.buffer.length,
    origem: "whatsapp",
    status_processamento: "processando",
    observacoes: observacoes || null,
  };

  const insertExtended = {
    ...insertBase,
    enviado_por: params.whatsappFrom,
    enviado_por_nome: params.enviadoPorNome,
  };

  let data: { id: string } | null = null;
  let insertError: { message: string; code?: string } | null = null;

  ({ data, error: insertError } = await supabase
    .from("notas_fiscais")
    .insert(insertExtended)
    .select("id")
    .single());

  if (insertError?.code === "PGRST204" || insertError?.message.includes("enviado_por")) {
    ({ data, error: insertError } = await supabase
      .from("notas_fiscais")
      .insert(insertBase)
      .select("id")
      .single());
  }

  if (insertError || !data) {
    await supabase.storage.from(NOTAS_FISCAIS_BUCKET).remove([storagePath]);
    throw new Error(insertError?.message ?? "Erro ao registrar nota fiscal.");
  }

  await registrarEventoNotaFiscal(supabase, {
    notaId: data.id,
    acao: "enviada",
    usuarioNome: params.enviadoPorNome,
    detalhes: {
      origem: "whatsapp",
      whatsappFrom: params.whatsappFrom,
      whatsappMessageId: params.whatsappMessageId,
    },
  });

  return { notaId: data.id, storagePath };
}
