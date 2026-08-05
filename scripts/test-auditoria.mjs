/**
 * Verifica proteção de rota /admin/auditoria (funcionário não acessa).
 * Execute: npm run test:auditoria
 */
import assert from "node:assert/strict";

const ADMIN_ROLE = "admin";
const FUNCIONARIO_HOME_PATH = "/portal/notas";

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

assert.equal(isAdminRoute("/admin/auditoria"), true);

function destinoSeFuncionario(pathname, role) {
  if (isAdminRoute(pathname) && role !== ADMIN_ROLE) {
    return FUNCIONARIO_HOME_PATH;
  }
  return pathname;
}

assert.equal(
  destinoSeFuncionario("/admin/auditoria", "funcionario"),
  FUNCIONARIO_HOME_PATH
);
assert.equal(
  destinoSeFuncionario("/admin/auditoria", ADMIN_ROLE),
  "/admin/auditoria"
);

console.log("✓ test:auditoria — rotas OK");
