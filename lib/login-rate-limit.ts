import { verificarRateLimit } from "@/lib/rate-limit-store";

const LOGIN_RATE_LIMIT = {
  maxRequests: 8,
  windowMs: 15 * 60 * 1000,
} as const;

export async function verificarRateLimitLogin(params: {
  ip: string;
  email: string;
}): Promise<{ permitido: boolean; retryAfterSec?: number }> {
  const email = params.email.trim().toLowerCase();
  const ip = params.ip.trim() || "unknown";

  const porIp = await verificarRateLimit(`login:ip:${ip}`, LOGIN_RATE_LIMIT);
  if (!porIp.permitido) return porIp;

  if (email) {
    const porEmail = await verificarRateLimit(
      `login:email:${email}`,
      LOGIN_RATE_LIMIT
    );
    if (!porEmail.permitido) return porEmail;
  }

  return { permitido: true };
}
