#!/usr/bin/env node
/**
 * Mede tamanho das rotas após `npm run build` (First Load JS no output do Next).
 * Uso: npm run build 2>&1 | tee /tmp/cedro-build.log && node scripts/perf-build-routes.mjs /tmp/cedro-build.log
 */
import { readFileSync } from "node:fs";

const logPath = process.argv[2];
if (!logPath) {
  console.error("Informe o caminho do log do build: node scripts/perf-build-routes.mjs build.log");
  process.exit(1);
}

const log = readFileSync(logPath, "utf8");
const routes = [
  "/dashboard",
  "/obras/[id]",
  "/portal/notas",
  "/",
];

console.log("Rotas monitoradas (procure First Load JS no log completo do Next):\n");
for (const route of routes) {
  const re = new RegExp(route.replace(/\[id\]/, "\\[id\\]") + "[\\s\\S]{0,120}?(\\d+(?:\\.\\d+)? kB)", "m");
  const match = log.match(re);
  console.log(`  ${route}: ${match ? match[1] : "(ver Route (app) no log do build)"}`);
}

console.log(
  "\nCompare este log antes/depois das otimizações. TTFB em produção depende também do Supabase e do middleware."
);
