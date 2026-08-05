/**
 * Testes unitários — status e filtros Minhas Notas
 * Uso: node scripts/test-minhas-notas.mjs
 */
import assert from "node:assert/strict";

function normalizarStatusNota(status) {
  if (status === "confirmado") return "aprovada";
  if (status === "revisar" || status === "processado") return "pendente_aprovacao";
  return status;
}

function formatStatusFuncionario(status) {
  switch (normalizarStatusNota(status)) {
    case "aguardando":
      return "Recebida";
    case "processando":
      return "Em análise";
    case "pendente_aprovacao":
      return "Aguardando aprovação";
    case "aprovada":
      return "Aprovada";
    case "rejeitada":
      return "Rejeitada";
    case "erro":
      return "Erro no processamento";
    default:
      return "Em análise";
  }
}

function notaPassaFiltroFuncionario(status, filtro) {
  if (filtro === "todas") return true;
  const s = normalizarStatusNota(status);
  switch (filtro) {
    case "em_analise":
      return s === "aguardando" || s === "processando" || status === "erro";
    case "aguardando_aprovacao":
      return s === "pendente_aprovacao" || status === "correcao_solicitada";
    case "aprovadas":
      return s === "aprovada";
    case "rejeitadas":
      return s === "rejeitada";
    default:
      return true;
  }
}

assert.equal(formatStatusFuncionario("aguardando"), "Recebida");
assert.equal(formatStatusFuncionario("processando"), "Em análise");
assert.equal(formatStatusFuncionario("pendente_aprovacao"), "Aguardando aprovação");
assert.equal(formatStatusFuncionario("confirmado"), "Aprovada");
assert.equal(formatStatusFuncionario("erro"), "Erro no processamento");

assert.equal(notaPassaFiltroFuncionario("processando", "em_analise"), true);
assert.equal(notaPassaFiltroFuncionario("pendente_aprovacao", "em_analise"), false);
assert.equal(notaPassaFiltroFuncionario("aprovada", "aprovadas"), true);
assert.equal(notaPassaFiltroFuncionario("rejeitada", "rejeitadas"), true);

console.log("✓ test-minhas-notas: 9 asserções OK");
