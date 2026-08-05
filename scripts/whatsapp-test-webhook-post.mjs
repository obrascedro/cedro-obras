/**
 * Simula POST do webhook Meta (sem download real da mídia).
 * Valida que a rota responde 200 e enfileira processamento.
 * Uso: node scripts/whatsapp-test-webhook-post.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(import.meta.dirname, "..", ".env.local");
const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  env[t.slice(0, eq)] = t.slice(eq + 1);
}

const port = process.env.CEDRO_DEV_PORT || "3001";
const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            contacts: [{ profile: { name: "Teste E2E" } }],
            messages: [
              {
                from: "5511999999999",
                id: `wamid.test.${Date.now()}`,
                type: "image",
                image: { id: "media-fake-id", mime_type: "image/jpeg" },
              },
            ],
          },
        },
      ],
    },
  ],
};

const res = await fetch(`http://127.0.0.1:${port}/api/webhooks/whatsapp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log("POST /api/webhooks/whatsapp");
console.log("Status:", res.status);
console.log("Body:", body);

if (res.status !== 200) {
  process.exit(1);
}

console.log("\n✓ Webhook POST aceito (processamento async em background).");
console.log(
  "Nota: sem WHATSAPP_TOKEN válido, o download da mídia falhará — esperado neste teste."
);
