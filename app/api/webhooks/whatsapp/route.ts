import { NextResponse } from "next/server";
import { after } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getWhatsAppConfig } from "@/lib/whatsapp/whatsapp-config";
import { processarMensagemMidiaWhatsApp } from "@/lib/whatsapp/processar-mensagem-whatsapp";
import {
  extrairMensagensMidia,
  isPayloadWhatsApp,
  validarAssinaturaWebhookMeta,
  validarVerificacaoWebhook,
  type WhatsAppWebhookPayload,
} from "@/lib/whatsapp/whatsapp-webhook";

export const runtime = "nodejs";

/** GET — verificação do webhook Meta (hub.challenge). */
export async function GET(request: Request) {
  const config = getWhatsAppConfig();
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    config.verifyToken &&
    validarVerificacaoWebhook({
      mode,
      token,
      expectedToken: config.verifyToken,
    }) &&
    challenge
  ) {
    console.log("[WhatsApp] webhook.verificado");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificação falhou." }, { status: 403 });
}

/** POST — recebe mensagens do WhatsApp Business Cloud API. */
export async function POST(request: Request) {
  const config = getWhatsAppConfig();
  const rawBody = await request.text();

  if (config.appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    const valido = validarAssinaturaWebhookMeta({
      rawBody,
      signatureHeader: signature,
      appSecret: config.appSecret,
    });

    if (!valido) {
      console.error("[WhatsApp] webhook.assinatura_invalida");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }
  } else {
    console.warn(
      "[WhatsApp] WHATSAPP_APP_SECRET não configurado — webhook aceito sem validação HMAC."
    );
  }

  let payload: WhatsAppWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isPayloadWhatsApp(payload)) {
    return NextResponse.json({ status: "ignored" });
  }

  const mensagens = extrairMensagensMidia(payload);

  if (mensagens.length === 0) {
    return NextResponse.json({ status: "no_media" });
  }

  const supabase = createSupabaseAdminClient();

  for (const mensagem of mensagens) {
    after(async () => {
      await processarMensagemMidiaWhatsApp(supabase, payload, mensagem);
    });
  }

  return NextResponse.json({ status: "received" });
}
