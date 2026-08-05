import { PORTAL_NOTAS_RATE_LIMIT } from "@/lib/portal-notas/config";
import { verificarRateLimit } from "@/lib/rate-limit-store";

export async function verificarRateLimitPortal(chave: string): Promise<{
  permitido: boolean;
  retryAfterSec?: number;
}> {
  return verificarRateLimit(`portal:${chave}`, PORTAL_NOTAS_RATE_LIMIT);
}
