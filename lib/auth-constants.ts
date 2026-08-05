export const ADMIN_ROLE = "admin" as const;
export const FUNCIONARIO_ROLE = "funcionario" as const;
export const DIRETORIA_ROLE = "diretoria" as const;

export type UserRole =
  | typeof ADMIN_ROLE
  | typeof FUNCIONARIO_ROLE
  | typeof DIRETORIA_ROLE;

export const ALL_ROLES: UserRole[] = [
  ADMIN_ROLE,
  FUNCIONARIO_ROLE,
  DIRETORIA_ROLE,
];

export const LOGIN_PATH = "/login";
export const ADMIN_HOME_PATH = "/dashboard";
export const FUNCIONARIO_HOME_PATH = "/portal/notas";
export const DIRETORIA_HOME_PATH = "/dashboard";

/** Rotas exclusivas de administrador (CRUD, configuração, auditoria). */
export const ADMIN_ROUTE_PREFIXES = [
  "/admin",
  "/obras",
  "/clientes",
  "/acompanhamento-obras",
  "/api/notas-fiscais",
] as const;

/** Rotas de leitura/gestão financeira — admin e diretoria. */
export const FINANCEIRO_ROUTE_PREFIXES = [
  "/dashboard",
  "/financeiro",
] as const;

export const PORTAL_ROUTE_PREFIXES = ["/portal"] as const;

export function isFinanceiroRoute(pathname: string): boolean {
  return FINANCEIRO_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

export function isAdminOnlyRoute(pathname: string): boolean {
  if (pathname === "/admin/login") return false;
  return ADMIN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
