/**
 * Teste E2E local do pipeline (sem Meta): storage → IA → pendente_aprovacao.
 * Uso: node --import tsx scripts/whatsapp-test-pipeline.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const obraId = env.WHATSAPP_DEFAULT_OBRA_ID;
if (!obraId) {
  console.error("WHATSAPP_DEFAULT_OBRA_ID não definido. Rode scripts/whatsapp-setup-env.mjs");
  process.exit(1);
}

// PNG 1x1 mínimo — suficiente para testar upload + pipeline (IA pode falhar em imagem vazia)
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const buffer = Buffer.from(PNG_BASE64, "base64");
const fileName = `test-whatsapp-${Date.now()}.png`;
const storagePath = `${obraId}/${fileName}`;

console.log("1/4 Upload storage...");
const { error: uploadError } = await supabase.storage
  .from("notas-fiscais")
  .upload(storagePath, buffer, { contentType: "image/png", upsert: false });
if (uploadError) throw new Error(`Upload: ${uploadError.message}`);

console.log("2/4 Insert notas_fiscais...");
const { data: nota, error: insertError } = await supabase
  .from("notas_fiscais")
  .insert({
    obra_id: obraId,
    arquivo_path: storagePath,
    arquivo_nome: fileName,
    arquivo_tipo: "image/png",
    arquivo_tamanho: buffer.length,
    origem: "whatsapp",
    status_processamento: "processando",
    observacoes: "Teste local WhatsApp",
  })
  .select("id")
  .single();
if (insertError || !nota) throw new Error(`Insert: ${insertError?.message}`);

console.log("3/4 Pipeline IA via API local...");
const port = process.env.CEDRO_DEV_PORT || "3001";
const lerRes = await fetch(`http://127.0.0.1:${port}/api/notas-fiscais/ler`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    storagePath,
    mimeType: "image/png",
    fileName,
    notaId: nota.id,
    enviadoPorNome: "Teste Local",
  }),
});

const lerBody = await lerRes.json();
console.log("   Status:", lerRes.status, lerBody.error ?? "OK");

console.log("4/4 Verificando status final...");
const { data: final, error: fetchError } = await supabase
  .from("notas_fiscais")
  .select("id, status_processamento, origem")
  .eq("id", nota.id)
  .single();
if (fetchError) throw new Error(fetchError.message);

console.log("\nResultado:", final);
if (final.status_processamento === "pendente_aprovacao") {
  console.log("✓ Pipeline concluído — pendente_aprovacao");
} else if (final.status_processamento === "erro") {
  console.log("⚠ Pipeline retornou erro (esperado com PNG 1x1 vazio). Storage + insert OK.");
} else {
  console.log("Status:", final.status_processamento);
}
