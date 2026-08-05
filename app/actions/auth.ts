"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ALL_ROLES,
  homePathForRole,
  LOGIN_PATH,
  getAppSession,
  type UserRole,
} from "@/lib/auth";
import { auditarAuth } from "@/lib/audit-helpers";
import { verificarRateLimitLogin } from "@/lib/login-rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type LoginState = {
  erro?: string;
};

function normalizeUsuario(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.includes("@")) return value.toLowerCase();
  return value.toLowerCase();
}

function isValidRole(role: string): role is UserRole {
  return (ALL_ROLES as string[]).includes(role);
}

async function resolveRoleAfterLogin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<UserRole | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, ativo")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.ativo || !isValidRole(profile.role)) {
    return null;
  }

  return profile.role;
}

async function obterIpCliente(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const usuario = normalizeUsuario(String(formData.get("usuario") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "").trim();

  if (!usuario || !password) {
    return { erro: "Informe usuário e senha." };
  }

  const ip = await obterIpCliente();
  const rateLimit = await verificarRateLimitLogin({ ip, email: usuario });
  if (!rateLimit.permitido) {
    const seg = rateLimit.retryAfterSec ?? 60;
    return {
      erro: `Muitas tentativas. Aguarde ${seg} segundos e tente novamente.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usuario,
    password,
  });

  if (error) {
    return { erro: "Usuário ou senha inválidos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Não foi possível validar a sessão." };
  }

  const role = await resolveRoleAfterLogin(supabase, user.id);

  if (!role) {
    await supabase.auth.signOut();
    return { erro: "Conta inativa ou sem permissão de acesso." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, funcionario_id")
    .eq("id", user.id)
    .maybeSingle();

  await auditarAuth(
    {
      userId: user.id,
      email: user.email ?? usuario,
      nome: profile?.nome ?? user.email ?? usuario,
      role,
      ativo: true,
      funcionario_id: profile?.funcionario_id ?? null,
    },
    "login"
  );

  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    redirect(nextPath);
  }

  redirect(homePathForRole(role));
}

export async function logoutAction(): Promise<void> {
  const session = await getAppSession();
  if (session) {
    await auditarAuth(session, "logout");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
