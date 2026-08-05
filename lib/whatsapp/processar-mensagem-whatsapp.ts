import type { SupabaseClient } from "@supabase/supabase-js";
import { processarNotaFiscalComIA } from "@/lib/nota-fiscal-processar";
import { marcarNotaFiscalErroServer } from "@/lib/notas-fiscais-db-server";
import {
  assertWhatsAppConfigured,
  WHATSAPP_MESSAGES,
} from "@/lib/whatsapp/whatsapp-config";
import { baixarMidiaWhatsApp } from "@/lib/whatsapp/whatsapp-download";
import {
  enviarMensagemWhatsAppSeguro,
  enviarMensagemWhatsApp,
} from "@/lib/whatsapp/whatsapp-reply";
import { salvarNotaWhatsAppNoStorage } from "@/lib/whatsapp/whatsapp-storage";
import {
  extrairNomeRemetente,
  isMimeSuportado,
  type WhatsAppMediaMessage,
  type WhatsAppWebhookPayload,
} from "@/lib/whatsapp/whatsapp-webhook";

const processados = new Set<string>();

function jaProcessou(messageId: string): boolean {
  if (processados.has(messageId)) return true;
  processados.add(messageId);
  if (processados.size > 500) {
    const first = processados.values().next().value;
    if (first) processados.delete(first);
  }
  return false;
}

export async function processarMensagemMidiaWhatsApp(
  supabase: SupabaseClient,
  payload: WhatsAppWebhookPayload,
  mensagem: WhatsAppMediaMessage
): Promise<void> {
  if (jaProcessou(mensagem.messageId)) {
    console.log("[WhatsApp] mensagem.duplicada", { id: mensagem.messageId });
    return;
  }

  const config = assertWhatsAppConfigured();
  const enviadoPorNome = extrairNomeRemetente(payload, mensagem.from);

  if (!isMimeSuportado(mensagem.mimeType)) {
    await enviarMensagemWhatsAppSeguro(
      mensagem.from,
      WHATSAPP_MESSAGES.tipoInvalido
    );
    return;
  }

  let notaId: string | undefined;

  try {
    await enviarMensagemWhatsApp(mensagem.from, WHATSAPP_MESSAGES.recebida);

    const { buffer, mimeType } = await baixarMidiaWhatsApp(mensagem.mediaId);

    const { notaId: id, storagePath } = await salvarNotaWhatsAppNoStorage(
      supabase,
      {
        obraId: config.defaultObraId!,
        buffer,
        mimeType: mimeType || mensagem.mimeType,
        fileName: mensagem.fileName,
        enviadoPorNome,
        whatsappFrom: mensagem.from,
        whatsappMessageId: mensagem.messageId,
        caption: mensagem.caption,
      }
    );

    notaId = id;

    await processarNotaFiscalComIA(supabase, {
      storagePath,
      mimeType: mimeType || mensagem.mimeType,
      fileName: mensagem.fileName,
      notaId,
      enviadoPorNome,
      observacoes: mensagem.caption,
    });

    await enviarMensagemWhatsApp(
      mensagem.from,
      WHATSAPP_MESSAGES.processada
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error("[WhatsApp] processar.erro", {
      messageId: mensagem.messageId,
      notaId,
      error: message,
    });

    if (notaId) {
      await marcarNotaFiscalErroServer(supabase, notaId, message);
    }

    await enviarMensagemWhatsAppSeguro(
      mensagem.from,
      WHATSAPP_MESSAGES.erro
    );
  }
}
