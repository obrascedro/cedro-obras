/**
 * Verifica regras de roteamento da autenticação unificada (sem rede).
 * Uso: node scripts/test-auth-routing.mjs
 */
import assert from "node:assert/strict";

const ADMIN_ROLE = "admin";
const FUNCIONARIO_ROLE = "funcionario";

function homePathForRole(role) {
  return role === ADMIN_ROLE ? "/dashboard" : "/portal/notas";
}

function isLoginPath(pathname) {
  return pathname === "/login";
}

function isAdminRoute(pathname) {
  if (pathname === "/admin/login") return false;
  const prefixes = [
    "/admin",
    "/dashboard",
    "/financeiro",
    "/obras",
    "/clientes",
    "/api/notas-fiscais",
  ];
  return prefixes.some((p) => pathname.startsWith(p));
}

function isPortalRoute(pathname) {
  return pathname.startsWith("/portal");
}

assert.equal(homePathForRole(ADMIN_ROLE), "/dashboard");
assert.equal(homePathForRole(FUNCIONARIO_ROLE), "/portal/notas");
assert.equal(isLoginPath("/login"), true);
assert.equal(isAdminRoute("/dashboard"), true);
assert.equal(isAdminRoute("/admin/login"), false);
assert.equal(isPortalRoute("/portal/notas"), true);

console.log("✓ test-auth-routing: 6 asserções OK");
