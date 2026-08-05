import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let envLoaded = false;

/** Garante leitura de .env.local no servidor (dev e build local). */
function ensureServerEnvLoaded(): void {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
}

function readServerEnv(name: string): string | undefined {
  ensureServerEnvLoaded();
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function createSupabaseAdminClient(): SupabaseClient {
  const url = readServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada no servidor. Adicione em .env.local e na Vercel."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Adicione em .env.local (salve o arquivo) e reinicie o servidor."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function assertSupabaseAdminConfigured(): void {
  createSupabaseAdminClient();
}
