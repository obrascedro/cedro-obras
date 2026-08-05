import { NextResponse } from "next/server";
import { after } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getWhatsAppConfig } from "@/lib/whatsapp/whatsapp-config";
import { processarMensagemMidiaWhatsApp } from "@/lib/whatsapp/processar-mensagem-whatsapp";
import {
  extrairMensagensMidia,
  isPayloadWhatsApp,
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
  let payload: WhatsAppWebhookPayload;

  try {
    payload = (await request.json()) as WhatsAppWebhookPayload;
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

  const supabase = createSupabaseServerClient();

  for (const mensagem of mensagens) {
    after(async () => {
      await processarMensagemMidiaWhatsApp(supabase, payload, mensagem);
    });
  }

  return NextResponse.json({ status: "received" });
}
