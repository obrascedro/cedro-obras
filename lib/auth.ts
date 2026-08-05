import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  ALL_ROLES,
  ADMIN_ROLE,
  DIRETORIA_ROLE,
  FUNCIONARIO_ROLE,
  ADMIN_HOME_PATH,
  DIRETORIA_HOME_PATH,
  FUNCIONARIO_HOME_PATH,
  PORTAL_ROUTE_PREFIXES,
  LOGIN_PATH,
  isAdminOnlyRoute,
  isFinanceiroRoute,
  type UserRole,
} from "@/lib/auth-constants";

export {
  ADMIN_ROLE,
  FUNCIONARIO_ROLE,
  DIRETORIA_ROLE,
  ALL_ROLES,
  type UserRole,
  LOGIN_PATH,
  ADMIN_HOME_PATH,
  FUNCIONARIO_HOME_PATH,
  DIRETORIA_HOME_PATH,
  ADMIN_ROUTE_PREFIXES,
  FINANCEIRO_ROUTE_PREFIXES,
  PORTAL_ROUTE_PREFIXES,
  isAdminOnlyRoute,
  isFinanceiroRoute,
} from "@/lib/auth-constants";

export type AppProfile = {
  role: UserRole;
  ativo: boolean;
  nome: string;
  funcionario_id: string | null;
};

export type AppSession = AppProfile & {
  userId: string;
  email: string;
};

function isValidRole(role: string): role is UserRole {
  return (ALL_ROLES as string[]).includes(role);
}

export function homePathForRole(role: UserRole): string {
  if (role === ADMIN_ROLE || role === DIRETORIA_ROLE) {
    return role === DIRETORIA_ROLE ? DIRETORIA_HOME_PATH : ADMIN_HOME_PATH;
  }
  return FUNCIONARIO_HOME_PATH;
}

export function isLoginPath(pathname: string): boolean {
  return pathname === LOGIN_PATH;
}

export function isAuthCallbackPath(pathname: string): boolean {
  return pathname.startsWith("/auth/callback");
}

/** @deprecated Use isAdminOnlyRoute ou isFinanceiroRoute */
export function isAdminRoute(pathname: string): boolean {
  return isAdminOnlyRoute(pathname) || isFinanceiroRoute(pathname);
}

export function isPortalRoute(pathname: string): boolean {
  return PORTAL_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isProtectedRoute(pathname: string): boolean {
  return (
    isAdminOnlyRoute(pathname) ||
    isFinanceiroRoute(pathname) ||
    isPortalRoute(pathname)
  );
}

export async function getAppSession(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, ativo, nome, funcionario_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.ativo || !isValidRole(profile.role)) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: profile.role,
    ativo: profile.ativo,
    nome: profile.nome,
    funcionario_id: profile.funcionario_id,
  };
}

export async function requireAdminSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session || session.role !== ADMIN_ROLE) {
    throw new Error("Acesso restrito a administradores.");
  }
  return session;
}

export async function requireAdminOrDiretoriaSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (
    !session ||
    (session.role !== ADMIN_ROLE && session.role !== DIRETORIA_ROLE)
  ) {
    throw new Error("Acesso restrito a administradores ou diretoria.");
  }
  return session;
}

export async function requirePortalSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  if (session.role === FUNCIONARIO_ROLE && !session.funcionario_id) {
    throw new Error(
      "Perfil de funcionário incompleto. Contate o administrador."
    );
  }
  return session;
}

/** @deprecated Use getAppSession */
export async function getAdminSession(): Promise<AppSession | null> {
  const session = await getAppSession();
  return session?.role === ADMIN_ROLE ? session : null;
}
