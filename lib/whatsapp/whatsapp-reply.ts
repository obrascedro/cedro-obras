import { assertWhatsAppConfigured } from "@/lib/whatsapp/whatsapp-config";

export async function enviarMensagemWhatsApp(
  to: string,
  text: string
): Promise<void> {
  const { token, phoneNumberId, graphApiVersion } = assertWhatsAppConfigured();

  const url = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[WhatsApp] reply.erro", {
      status: response.status,
      to,
      detail,
    });
    throw new Error(`Falha ao enviar mensagem WhatsApp (${response.status}).`);
  }
}

export async function enviarMensagemWhatsAppSeguro(
  to: string,
  text: string
): Promise<void> {
  try {
    await enviarMensagemWhatsApp(to, text);
  } catch (error) {
    console.error("[WhatsApp] reply.seguro.erro", {
      to,
      error: error instanceof Error ? error.message : error,
    });
  }
}
