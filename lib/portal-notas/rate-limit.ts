import { PORTAL_NOTAS_RATE_LIMIT } from "@/lib/portal-notas/config";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function verificarRateLimitPortal(chave: string): {
  permitido: boolean;
  retryAfterSec?: number;
} {
  const agora = Date.now();
  const bucket = buckets.get(chave);

  if (!bucket || agora >= bucket.resetAt) {
    buckets.set(chave, {
      count: 1,
      resetAt: agora + PORTAL_NOTAS_RATE_LIMIT.windowMs,
    });
    return { permitido: true };
  }

  if (bucket.count >= PORTAL_NOTAS_RATE_LIMIT.maxRequests) {
    return {
      permitido: false,
      retryAfterSec: Math.ceil((bucket.resetAt - agora) / 1000),
    };
  }

  bucket.count += 1;
  return { permitido: true };
}

/** Limpa entradas expiradas ocasionalmente (evita crescimento infinito). */
export function limparRateLimitExpirado(): void {
  const agora = Date.now();
  for (const [key, bucket] of buckets) {
    if (agora >= bucket.resetAt) buckets.delete(key);
  }
}
