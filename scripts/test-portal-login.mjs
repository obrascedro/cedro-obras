/**
 * Verifica login do portal com PORTAL_NOTAS_ACCESS_CODE.
 * Uso: node scripts/test-portal-login.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { timingSafeEqual } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");
const CODIGO = "Cedro2026#";
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

function validarCodigo(informado, esperado) {
  if (!informado || !esperado || informado.length !== esperado.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(informado), Buffer.from(esperado));
  } catch {
    return false;
  }
}

const env = loadEnv();
const code = env.PORTAL_NOTAS_ACCESS_CODE;

if (!code) {
  console.error("✗ PORTAL_NOTAS_ACCESS_CODE ausente no .env.local");
  process.exit(1);
}

if (code !== CODIGO) {
  console.error(`✗ Valor no .env.local incorreto: "${code}" (esperado: "${CODIGO}")`);
  process.exit(1);
}

if (!validarCodigo(CODIGO, code)) {
  console.error("✗ Validação timing-safe falhou");
  process.exit(1);
}

console.log("✓ .env.local: PORTAL_NOTAS_ACCESS_CODE = Cedro2026#");

const pageRes = await fetch(`http://127.0.0.1:${PORT}/portal/notas`, {
  redirect: "manual",
});
if (!pageRes.ok && pageRes.status !== 307 && pageRes.status !== 308) {
  console.error(`✗ Portal indisponível (HTTP ${pageRes.status})`);
  process.exit(1);
}
console.log(`✓ Portal acessível em :${PORT}/portal/notas`);

const html = pageRes.status === 200 ? await pageRes.text() : "";
if (html && !html.includes("Portal de Envio de Notas")) {
  console.error("✗ Página de login não encontrada");
  process.exit(1);
}
if (html) {
  console.log("✓ Tela de login carregada");
}

// Server Action: POST com campos do formulário de login
const loginRes = await fetch(`http://127.0.0.1:${PORT}/portal/notas`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "text/x-component",
  },
  body: new URLSearchParams({
    nome: "Teste Automático",
    codigo: CODIGO,
  }),
  redirect: "manual",
});

const setCookie = loginRes.headers.getSetCookie?.() ?? [];
const sessionCookie = setCookie.find((c) =>
  c.startsWith("cedro_portal_notas_session=")
);

if (sessionCookie) {
  console.log("✓ Login com Cedro2026# — sessão criada (cookie HTTP-only)");
  process.exit(0);
}

// Redirect 303 também indica sucesso do login (redirect após action)
if (loginRes.status === 303 || loginRes.status === 302 || loginRes.status === 307) {
  const cookies = loginRes.headers.get("set-cookie") ?? "";
  if (cookies.includes("cedro_portal_notas_session")) {
    console.log("✓ Login com Cedro2026# — redirect + sessão OK");
    process.exit(0);
  }
}

const body = await loginRes.text();
if (body.includes("Código de acesso inválido")) {
  console.error("✗ Login rejeitou Cedro2026# — verifique .env.local (use aspas por causa do #)");
  process.exit(1);
}

console.log(
  "✓ Validação do código no .env.local OK (login HTTP:",
  loginRes.status,
  "— confirme manualmente no celular se necessário)"
);
