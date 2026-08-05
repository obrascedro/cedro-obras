/**
 * Validação pré-produção — RLS anon + rotas HTTP sem sessão.
 * Uso: node scripts/validation-pre-prod.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const baseUrl = process.argv[2] ?? "http://localhost:3000";

const tables = [
  "notas_fiscais",
  "obras",
  "clientes",
  "gastos_obra",
  "portal_funcionarios",
  "profiles",
  "classificacoes_aprendidas",
  "assistente_conversas",
  "audit_logs",
];

async function testRls() {
  console.log("\n## RLS (anon REST API)\n");
  if (!supabaseUrl || !anonKey) {
    console.log("SKIP: credenciais Supabase ausentes em .env.local");
    return { skipped: true, vulnerable: [] };
  }

  const vulnerable = [];
  for (const table of tables) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=id&limit=3`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );
    let body = [];
    try {
      body = await res.json();
    } catch {
      body = [];
    }
    const exposed = Array.isArray(body) && body.length > 0;
    const status = exposed ? "EXPOSTO" : "OK";
    if (exposed) vulnerable.push(table);
    console.log(`- ${table}: HTTP ${res.status} | linhas: ${Array.isArray(body) ? body.length : "?"} | ${status}`);
  }
  return { skipped: false, vulnerable };
}

async function testRoutes() {
  console.log("\n## Rotas HTTP (sem cookie de sessão)\n");
  const paths = [
    "/login",
    "/dashboard",
    "/admin/auditoria",
    "/admin/funcionarios",
    "/financeiro/notas-fiscais",
    "/portal/notas",
    "/portal/minhas-notas",
    "/portal/minhas-notas/00000000-0000-0000-0000-000000000001",
  ];

  const results = [];
  for (const path of paths) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
      const location = res.headers.get("location") ?? "";
      const ok =
        path === "/login"
          ? res.status === 200
          : res.status === 307 || res.status === 308 || res.status === 302;
      results.push({ path, status: res.status, location, ok });
      console.log(
        `- ${path}: ${res.status}${location ? ` → ${location}` : ""} | ${ok ? "OK" : "ATENÇÃO"}`
      );
    } catch (e) {
      console.log(`- ${path}: ERRO (${e instanceof Error ? e.message : "fetch"})`);
      results.push({ path, error: true });
    }
  }
  return results;
}

async function testApis() {
  console.log("\n## APIs (sem autenticação)\n");
  const checks = [
    {
      name: "POST /api/notas-fiscais/ler",
      url: `${baseUrl}/api/notas-fiscais/ler`,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
      expect: 401,
    },
    {
      name: "POST /api/notas-fiscais/aprender-classificacao",
      url: `${baseUrl}/api/notas-fiscais/aprender-classificacao`,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
      expect: 401,
    },
    {
      name: "POST /api/webhooks/whatsapp (sem HMAC)",
      url: `${baseUrl}/api/webhooks/whatsapp`,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object: "whatsapp_business_account",
          entry: [],
        }),
      },
      expect: [401, 400, 200],
    },
  ];

  for (const c of checks) {
    try {
      const res = await fetch(c.url, c.init);
      const expects = Array.isArray(c.expect) ? c.expect : [c.expect];
      const ok = expects.includes(res.status);
      console.log(`- ${c.name}: HTTP ${res.status} | ${ok ? "OK" : "ATENÇÃO"}`);
    } catch (e) {
      console.log(`- ${c.name}: ERRO (${e instanceof Error ? e.message : "fetch"})`);
    }
  }
}

const rls = await testRls();
await testRoutes();
await testApis();

if (rls.vulnerable?.length) {
  console.log("\n⚠️  Tabelas expostas via anon:", rls.vulnerable.join(", "));
  console.log("   → Execute supabase/production-rls-hardening.sql no Supabase.");
  process.exitCode = 1;
}
