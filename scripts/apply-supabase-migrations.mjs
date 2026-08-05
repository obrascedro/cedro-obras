/**
 * Aplica migrations SQL do diretório supabase/ (requer SUPABASE_DB_URL).
 * Obtenha em: Supabase → Project Settings → Database → Connection string (URI)
 * Uso: SUPABASE_DB_URL="postgresql://..." node scripts/apply-supabase-migrations.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Defina SUPABASE_DB_URL com a connection string do Postgres.");
  console.error("Exemplo: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres");
  process.exit(1);
}

const dir = resolve(import.meta.dirname, "..", "supabase");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const file of files) {
  const sql = readFileSync(resolve(dir, file), "utf8");
  console.log(`→ ${file}`);
  try {
    await client.query(sql);
    console.log(`  ✓ OK`);
  } catch (error) {
    console.error(`  ✗ ${error instanceof Error ? error.message : error}`);
  }
}

await client.end();
console.log("\nMigrations concluídas.");
