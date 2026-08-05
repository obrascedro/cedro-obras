import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ROLE,
  DIRETORIA_ROLE,
  FUNCIONARIO_HOME_PATH,
  homePathForRole,
  isAdminOnlyRoute,
  isAuthCallbackPath,
  isFinanceiroRoute,
  isLoginPath,
  isPortalRoute,
  LOGIN_PATH,
  ALL_ROLES,
  type AppProfile,
  type UserRole,
} from "@/lib/auth";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function isValidRole(role: string): role is UserRole {
  return (ALL_ROLES as string[]).includes(role);
}

async function loadProfile(
  supabase: ReturnType<typeof createSupabaseMiddlewareClient>["supabase"],
  userId: string
): Promise<AppProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, ativo, nome, funcionario_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !profile.ativo || !isValidRole(profile.role)) {
    return null;
  }

  return {
    role: profile.role,
    ativo: profile.ativo,
    nome: profile.nome,
    funcionario_id: profile.funcionario_id,
  };
}

function redirectToLogin(request: NextRequest, extra?: Record<string, string>) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      loginUrl.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  if (isAuthCallbackPath(pathname)) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await loadProfile(supabase, user.id) : null;

  if (pathname === "/") {
    if (profile) {
      return NextResponse.redirect(
        new URL(homePathForRole(profile.role), request.url)
      );
    }
    return response;
  }

  if (isLoginPath(pathname)) {
    if (profile) {
      return NextResponse.redirect(
        new URL(homePathForRole(profile.role), request.url)
      );
    }
    return response;
  }

  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const protectedRoute =
    isAdminOnlyRoute(pathname) ||
    isFinanceiroRoute(pathname) ||
    isPortalRoute(pathname);

  if (!protectedRoute) {
    return response;
  }

  if (!user || !profile) {
    if (user && !profile) {
      await supabase.auth.signOut();
    }
    const next = pathname !== LOGIN_PATH ? pathname : undefined;
    return redirectToLogin(
      request,
      next
        ? { next, ...(user && !profile ? { erro: "inativo" } : {}) }
        : undefined
    );
  }

  if (isAdminOnlyRoute(pathname)) {
    if (profile.role !== ADMIN_ROLE) {
      return NextResponse.redirect(
        new URL(
          profile.role === DIRETORIA_ROLE
            ? "/dashboard"
            : FUNCIONARIO_HOME_PATH,
          request.url
        )
      );
    }
  }

  if (isFinanceiroRoute(pathname)) {
    if (
      profile.role !== ADMIN_ROLE &&
      profile.role !== DIRETORIA_ROLE
    ) {
      return NextResponse.redirect(new URL(FUNCIONARIO_HOME_PATH, request.url));
    }
  }

  if (isPortalRoute(pathname) && profile.role === DIRETORIA_ROLE) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
