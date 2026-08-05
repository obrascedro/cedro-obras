export const PORTAL_NOTAS_COOKIE = "cedro_portal_notas_session";
export const PORTAL_NOTAS_SESSION_MAX_AGE_SEC = 8 * 60 * 60; // 8 horas
export const PORTAL_NOTAS_ORIGEM = "portal_funcionario" as const;

export const PORTAL_NOTAS_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 10,
} as const;

export const PORTAL_NOTAS_MSG = {
  senhaInvalida: "Senha inválida.",
  funcionarioNaoAutorizado: "Funcionário não autorizado.",
} as const;

export function getPortalNotasAccessCode(): string | undefined {
  const raw = process.env.PORTAL_NOTAS_ACCESS_CODE;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function assertPortalNotasConfigured(): string {
  const code = getPortalNotasAccessCode();
  if (!code) {
    throw new Error(
      "Portal de notas não configurado. Defina PORTAL_NOTAS_ACCESS_CODE no servidor."
    );
  }
  return code;
}
