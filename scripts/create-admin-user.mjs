/**
 * Cria usuário administrador no Supabase Auth (requer SUPABASE_SERVICE_ROLE_KEY).
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY="..." node scripts/create-admin-user.mjs
 *
 * Variáveis obrigatórias:
 *   ADMIN_PASSWORD — senha forte (sem valor padrão)
 *
 * Variáveis opcionais:
 *   ADMIN_EMAIL (padrão: admin@cedroobras.com.br)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cedroobras.com.br";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
  );
  console.error(
    "Service role: Supabase → Project Settings → API → service_role (secret)"
  );
  process.exit(1);
}

if (!adminPassword || adminPassword.length < 12) {
  console.error(
    "Defina ADMIN_PASSWORD com pelo menos 12 caracteres. Exemplo:"
  );
  console.error('  ADMIN_PASSWORD="sua-senha-forte" node scripts/create-admin-user.mjs');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`→ Criando/atualizando administrador: ${adminEmail}`);

const { data: created, error: createError } = await admin.auth.admin.createUser(
  {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    app_metadata: { role: "admin" },
  }
);

let userId = created.user?.id;

if (createError) {
  if (!createError.message.toLowerCase().includes("already")) {
    console.error("✗ Erro ao criar usuário:", createError.message);
    process.exit(1);
  }

  const { data: listed, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("✗ Erro ao listar usuários:", listError.message);
    process.exit(1);
  }

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  if (!existing) {
    console.error("✗ Usuário já existe, mas não foi encontrado na listagem.");
    process.exit(1);
  }

  userId = existing.id;

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: adminPassword,
    app_metadata: { role: "admin" },
  });

  if (updateError) {
    console.error("✗ Erro ao atualizar usuário:", updateError.message);
    process.exit(1);
  }

  console.log("→ Usuário já existia; senha e role atualizados.");
}

if (!userId) {
  console.error("✗ ID do usuário não encontrado.");
  process.exit(1);
}

const sqlPath = resolve(import.meta.dirname, "..", "supabase", "admin-auth.sql");
const sql = readFileSync(sqlPath, "utf8");

if (process.env.SUPABASE_DB_URL) {
  const pg = (await import("pg")).default;
  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("→ SQL admin-auth.sql aplicado.");
} else {
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: adminEmail,
      role: "admin",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.warn(
      "⚠ Não foi possível gravar profile (execute supabase/admin-auth.sql):",
      profileError.message
    );
  }
}

console.log("✓ Administrador pronto.");
console.log(`  E-mail: ${adminEmail}`);
console.log(`  Senha:  ${adminPassword}`);
console.log(`  Login:  /admin/login`);
