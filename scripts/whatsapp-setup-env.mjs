/**
 * Preenche variáveis WhatsApp no .env.local e busca a primeira obra.
 * Uso: node scripts/whatsapp-setup-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

function upsertEnvLine(lines, key, value) {
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  const entry = `${key}=${value}`;
  if (idx >= 0) lines[idx] = entry;
  else lines.push(entry);
}

const env = loadEnvFile(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórios.");
  process.exit(1);
}

const verifyToken =
  env.WHATSAPP_VERIFY_TOKEN || `cedro_${randomBytes(16).toString("hex")}`;

let defaultObraId = env.WHATSAPP_DEFAULT_OBRA_ID;

if (!defaultObraId) {
  const res = await fetch(`${url}/rest/v1/obras?select=id,nome&order=nome&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    console.error("Erro ao buscar obras:", await res.text());
    process.exit(1);
  }
  const obras = await res.json();
  if (!obras?.length) {
    console.error("Nenhuma obra encontrada. Crie uma obra antes de configurar o WhatsApp.");
    process.exit(1);
  }
  defaultObraId = obras[0].id;
  console.log(`Obra padrão: ${obras[0].nome} (${defaultObraId})`);
}

const lines = existsSync(envPath)
  ? readFileSync(envPath, "utf8").split("\n").filter((l, i, arr) => !(i === arr.length - 1 && l === ""))
  : [];

upsertEnvLine(lines, "WHATSAPP_VERIFY_TOKEN", verifyToken);
upsertEnvLine(lines, "WHATSAPP_DEFAULT_OBRA_ID", defaultObraId);

if (!env.WHATSAPP_TOKEN) {
  upsertEnvLine(lines, "WHATSAPP_TOKEN", "");
}
if (!env.WHATSAPP_PHONE_NUMBER_ID) {
  upsertEnvLine(lines, "WHATSAPP_PHONE_NUMBER_ID", "");
}

writeFileSync(envPath, `${lines.join("\n")}\n`);

console.log("\n.env.local atualizado:");
console.log(`  WHATSAPP_VERIFY_TOKEN=${verifyToken}`);
console.log(`  WHATSAPP_DEFAULT_OBRA_ID=${defaultObraId}`);
console.log("\nPreencha manualmente:");
console.log("  WHATSAPP_TOKEN=<token permanente da Meta>");
console.log("  WHATSAPP_PHONE_NUMBER_ID=<id do número WhatsApp>");

// Verifica se UPDATE funciona (necessário para pipeline IA)
const probeRes = await fetch(`${url}/rest/v1/notas_fiscais?select=id&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const probe = await probeRes.json();
if (probe?.[0]?.id) {
  const patchRes = await fetch(
    `${url}/rest/v1/notas_fiscais?id=eq.${probe[0].id}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status_processamento: probe[0].status ?? "aguardando" }),
    }
  );
  const patched = await patchRes.json();
  if (!Array.isArray(patched) || patched.length === 0) {
    console.warn("\n⚠ UPDATE bloqueado no Supabase. Execute no SQL Editor:");
    console.warn("   supabase/notas-fiscais-update.sql");
    console.warn("   supabase/notas-fiscais-aprovacao.sql");
  } else {
    console.log("\n✓ Política UPDATE OK no Supabase.");
  }
}
