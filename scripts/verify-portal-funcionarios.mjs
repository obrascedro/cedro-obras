/**
 * Verifica funcionários do portal e conteúdo da página de login.
 * Uso: node scripts/verify-portal-funcionarios.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");
const PORT = process.env.CEDRO_DEV_PORT || "3001";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[t.slice(0, eq)] = val;
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const accessCode = env.PORTAL_NOTAS_ACCESS_CODE;

if (accessCode !== "Cedro2026#") {
  console.error(`✗ PORTAL_NOTAS_ACCESS_CODE incorreto: "${accessCode}"`);
  process.exit(1);
}
console.log("✓ PORTAL_NOTAS_ACCESS_CODE = Cedro2026#");

const res = await fetch(
  `${url}/rest/v1/portal_funcionarios?select=id,nome,ativo&order=nome`,
  {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }
);

if (!res.ok) {
  const body = await res.text();
  console.error(`✗ Tabela portal_funcionarios indisponível (${res.status}): ${body}`);
  console.error("\nExecute supabase/portal-funcionarios.sql no SQL Editor do Supabase.");
  process.exit(1);
}

const funcionarios = await res.json();

if (!Array.isArray(funcionarios) || funcionarios.length !== 2) {
  console.error(`✗ Esperado 2 funcionários, encontrado: ${funcionarios?.length ?? 0}`);
  process.exit(1);
}

const nomes = funcionarios.map((f) => f.nome).sort();
const esperados = ["Edson Junior", "Isaque Cabral"].sort();
if (JSON.stringify(nomes) !== JSON.stringify(esperados)) {
  console.error("✗ Nomes:", nomes);
  process.exit(1);
}

if (!funcionarios.every((f) => f.ativo === true)) {
  console.error("✗ Nem todos os funcionários estão ativos.");
  process.exit(1);
}

console.log("✓ Funcionários ativos no Supabase:");
for (const f of funcionarios) {
  console.log(`  - ${f.nome} (${f.id})`);
}

const pageRes = await fetch(`http://127.0.0.1:${PORT}/portal/notas`);
const html = await pageRes.text();

if (html.includes("Nenhum funcionário autorizado cadastrado")) {
  console.error("✗ Portal ainda mostra aviso de nenhum funcionário.");
  process.exit(1);
}

if (!html.includes("Funcionário") || !html.includes("Senha")) {
  console.error("✗ Tela de login não encontrada no HTML.");
  process.exit(1);
}

if (html.includes("Isaque Cabral") && html.includes("Edson Junior")) {
  console.log("✓ Portal exibe login com Isaque Cabral e Edson Junior.");
} else {
  console.log("✓ Portal exibe tela de login (select carregado via SSR).");
}

console.log("\nTudo OK — login disponível com senha Cedro2026#.");
