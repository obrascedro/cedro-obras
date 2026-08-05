/**
 * Rate limit com fallback em memória (dev / single instance).
 * Em produção multi-instância, configure UPSTASH_REDIS_REST_URL e
 * UPSTASH_REDIS_REST_TOKEN para limites distribuídos (A-04).
 */

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

export type RateLimitResult = {
  permitido: boolean;
  retryAfterSec?: number;
};

function checkMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const agora = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || agora >= bucket.resetAt) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: agora + config.windowMs,
    });
    return { permitido: true };
  }

  if (bucket.count >= config.maxRequests) {
    return {
      permitido: false,
      retryAfterSec: Math.ceil((bucket.resetAt - agora) / 1000),
    };
  }

  bucket.count += 1;
  return { permitido: true };
}

async function checkUpstash(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000));
  const redisKey = `cedro:rl:${key}`;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["TTL", redisKey],
      ]),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ result: number }>;
    const count = results[0]?.result ?? 1;
    let ttl = results[1]?.result ?? -1;

    if (ttl === -1) {
      await fetch(`${url}/EXPIRE/${encodeURIComponent(redisKey)}/${windowSec}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      ttl = windowSec;
    }

    if (count > config.maxRequests) {
      return { permitido: false, retryAfterSec: Math.max(1, ttl) };
    }

    return { permitido: true };
  } catch {
    return null;
  }
}

export async function verificarRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const distributed = await checkUpstash(key, config);
  if (distributed) return distributed;
  return checkMemory(key, config);
}

export function limparRateLimitMemoriaExpirado(): void {
  const agora = Date.now();
  for (const [key, bucket] of memoryBuckets) {
    if (agora >= bucket.resetAt) memoryBuckets.delete(key);
  }
}
