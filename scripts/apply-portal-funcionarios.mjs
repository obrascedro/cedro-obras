/**
 * Aplica supabase/portal-funcionarios.sql (requer SUPABASE_DB_URL).
 * Obtenha em: Supabase → Project Settings → Database → Connection string (URI)
 *
 * Uso:
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@..." node scripts/apply-portal-funcionarios.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Defina SUPABASE_DB_URL com a connection string do Postgres.");
  console.error(
    "Alternativa: execute supabase/portal-funcionarios.sql manualmente no SQL Editor."
  );
  process.exit(1);
}

const sqlPath = resolve(import.meta.dirname, "..", "supabase", "portal-funcionarios.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("→ Aplicando portal-funcionarios.sql …");
await client.query(sql);

const { rows } = await client.query(
  `SELECT id, nome, ativo FROM public.portal_funcionarios ORDER BY nome`
);
await client.end();

console.log(`✓ ${rows.length} funcionário(s) cadastrado(s):`);
for (const row of rows) {
  console.log(`  - ${row.nome} (ativo: ${row.ativo})`);
}

if (rows.length !== 2) {
  console.error("✗ Esperado exatamente 2 funcionários.");
  process.exit(1);
}

const nomes = rows.map((r) => r.nome).sort();
const esperados = ["Edson Junior", "Isaque Cabral"].sort();
if (JSON.stringify(nomes) !== JSON.stringify(esperados)) {
  console.error("✗ Nomes não correspondem:", nomes);
  process.exit(1);
}

if (!rows.every((r) => r.ativo)) {
  console.error("✗ Nem todos estão ativos.");
  process.exit(1);
}

console.log("✓ Isaque Cabral e Edson Junior ativos.");
