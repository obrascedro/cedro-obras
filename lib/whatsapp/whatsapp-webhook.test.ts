import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extrairMensagensMidia,
  isPayloadWhatsApp,
  isMimeSuportado,
  validarVerificacaoWebhook,
} from "./whatsapp-webhook";

describe("whatsapp-webhook", () => {
  it("valida verificação Meta", () => {
    assert.equal(
      validarVerificacaoWebhook({
        mode: "subscribe",
        token: "meu-token",
        expectedToken: "meu-token",
      }),
      true
    );
    assert.equal(
      validarVerificacaoWebhook({
        mode: "subscribe",
        token: "errado",
        expectedToken: "meu-token",
      }),
      false
    );
  });

  it("identifica payload WhatsApp", () => {
    assert.equal(
      isPayloadWhatsApp({ object: "whatsapp_business_account" }),
      true
    );
    assert.equal(isPayloadWhatsApp({ object: "page" }), false);
  });

  it("extrai mensagem de imagem", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "5511999999999",
                    id: "wamid.123",
                    type: "image",
                    image: { id: "media-1", mime_type: "image/jpeg" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const msgs = extrairMensagensMidia(payload);
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].mediaId, "media-1");
    assert.equal(msgs[0].mimeType, "image/jpeg");
  });

  it("aceita mime suportado", () => {
    assert.equal(isMimeSuportado("application/pdf"), true);
    assert.equal(isMimeSuportado("video/mp4"), false);
  });
});
