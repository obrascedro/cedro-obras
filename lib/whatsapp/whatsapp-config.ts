export function getWhatsAppConfig() {
  const token =
    process.env.WHATSAPP_TOKEN?.trim() ||
    process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const defaultObraId = process.env.WHATSAPP_DEFAULT_OBRA_ID;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v21.0";
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  return {
    token,
    phoneNumberId,
    verifyToken,
    defaultObraId,
    graphApiVersion,
    appSecret,
    isConfigured: Boolean(token && phoneNumberId && verifyToken),
  };
}

export function assertWhatsAppConfigured() {
  const config = getWhatsAppConfig();
  if (!config.isConfigured) {
    throw new Error(
      "WhatsApp não configurado. Defina WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_VERIFY_TOKEN."
    );
  }
  if (!config.defaultObraId) {
    throw new Error(
      "WHATSAPP_DEFAULT_OBRA_ID não configurado — necessário para vincular notas recebidas via WhatsApp."
    );
  }
  return config;
}

export const WHATSAPP_MESSAGES = {
  recebida:
    "Recebemos sua nota.\nEla será analisada e enviada para aprovação.",
  processada:
    "Sua nota foi processada e está aguardando aprovação.",
  erro: "Não foi possível processar sua nota. Tente enviar novamente ou use o site.",
  tipoInvalido:
    "Envie uma imagem (JPG, PNG) ou PDF da nota fiscal.",
} as const;
