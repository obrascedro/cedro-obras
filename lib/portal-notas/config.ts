export const PORTAL_HEADER_IMAGE = "/portal-obra-header.jpg";

export const PORTAL_NOTAS_ORIGEM = "portal_funcionario" as const;

export const PORTAL_NOTAS_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 20,
} as const;

export const PORTAL_NOTAS_MSG = {
  funcionarioNaoAutorizado: "Funcionário não autorizado.",
  sessaoExpirada: "Sessão expirada. Faça login novamente.",
} as const;
