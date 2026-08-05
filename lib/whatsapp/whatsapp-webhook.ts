export type WhatsAppMediaMessage = {
  messageId: string;
  from: string;
  mediaId: string;
  mimeType: string;
  fileName: string;
  caption?: string;
};

export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<Record<string, unknown>>;
        contacts?: Array<{ profile?: { name?: string } }>;
      };
    }>;
  }>;
};

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export function extensaoPorMime(mimeType: string): string {
  return MIME_EXT[mimeType.toLowerCase()] ?? ".bin";
}

export function isMimeSuportado(mimeType: string): boolean {
  return mimeType.toLowerCase() in MIME_EXT;
}

function extrairNomeContato(
  payload: WhatsAppWebhookPayload,
  from: string
): string {
  const contact = payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
  return contact?.profile?.name?.trim() || `WhatsApp ${from}`;
}

export function extrairMensagensMidia(
  payload: WhatsAppWebhookPayload
): WhatsAppMediaMessage[] {
  const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
  const resultado: WhatsAppMediaMessage[] = [];

  for (const msg of messages) {
    const type = String(msg.type ?? "");
    const from = String(msg.from ?? "");
    const messageId = String(msg.id ?? "");
    if (!from || !messageId) continue;

    if (type === "image") {
      const image = msg.image as { id?: string; mime_type?: string } | undefined;
      if (!image?.id) continue;
      const mimeType = image.mime_type ?? "image/jpeg";
      resultado.push({
        messageId,
        from,
        mediaId: image.id,
        mimeType,
        fileName: `nota-whatsapp${extensaoPorMime(mimeType)}`,
        caption: typeof msg.caption === "string" ? msg.caption : undefined,
      });
      continue;
    }

    if (type === "document") {
      const doc = msg.document as
        | { id?: string; mime_type?: string; filename?: string }
        | undefined;
      if (!doc?.id) continue;
      const mimeType = doc.mime_type ?? "application/pdf";
      resultado.push({
        messageId,
        from,
        mediaId: doc.id,
        mimeType,
        fileName:
          doc.filename?.trim() ||
          `nota-whatsapp${extensaoPorMime(mimeType)}`,
        caption: typeof msg.caption === "string" ? msg.caption : undefined,
      });
    }
  }

  return resultado;
}

import crypto from "node:crypto";

export function validarAssinaturaWebhookMeta(params: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}): boolean {
  const { rawBody, signatureHeader, appSecret } = params;
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

export function extrairNomeRemetente(
  payload: WhatsAppWebhookPayload,
  from: string
): string {
  return extrairNomeContato(payload, from);
}

export function validarVerificacaoWebhook(params: {
  mode: string | null;
  token: string | null;
  expectedToken: string;
}): boolean {
  return params.mode === "subscribe" && params.token === params.expectedToken;
}

export function isPayloadWhatsApp(payload: WhatsAppWebhookPayload): boolean {
  return payload.object === "whatsapp_business_account";
}
