import { assertWhatsAppConfigured } from "@/lib/whatsapp/whatsapp-config";

type MediaUrlResponse = {
  url?: string;
  mime_type?: string;
  file_size?: number;
};

export async function baixarMidiaWhatsApp(mediaId: string): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  const { token, graphApiVersion } = assertWhatsAppConfigured();

  const metaUrl = `https://graph.facebook.com/${graphApiVersion}/${mediaId}`;
  const metaResponse = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaResponse.ok) {
    const detail = await metaResponse.text();
    throw new Error(
      `Falha ao obter URL da mídia WhatsApp (${metaResponse.status}): ${detail}`
    );
  }

  const meta = (await metaResponse.json()) as MediaUrlResponse;
  if (!meta.url) {
    throw new Error("URL da mídia WhatsApp não retornada pela Meta.");
  }

  const fileResponse = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!fileResponse.ok) {
    throw new Error(
      `Falha ao baixar arquivo da mídia WhatsApp (${fileResponse.status}).`
    );
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  const mimeType =
    meta.mime_type ??
    fileResponse.headers.get("content-type") ??
    "application/octet-stream";

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: mimeType.split(";")[0].trim(),
  };
}
