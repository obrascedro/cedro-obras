import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  assertPortalNotasConfigured,
  getPortalNotasAccessCode,
  PORTAL_NOTAS_COOKIE,
  PORTAL_NOTAS_SESSION_MAX_AGE_SEC,
} from "@/lib/portal-notas/config";

export type PortalNotasSession = {
  funcionarioId: string;
  nome: string;
  loginEm: number;
  exp: number;
};

function assinar(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function criarTokenSessaoPortal(
  params: {
    funcionarioId: string;
    nome: string;
  },
  secret: string
): string {
  const loginEm = Date.now();
  const data: PortalNotasSession = {
    funcionarioId: params.funcionarioId,
    nome: params.nome.trim(),
    loginEm,
    exp: loginEm + PORTAL_NOTAS_SESSION_MAX_AGE_SEC * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${encoded}.${assinar(encoded, secret)}`;
}

export function verificarTokenSessaoPortal(
  token: string,
  secret: string
): PortalNotasSession | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = assinar(encoded, secret);
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const raw = Buffer.from(encoded, "base64url").toString("utf8");
    const data = JSON.parse(raw) as PortalNotasSession;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (!data.funcionarioId?.trim() || !data.nome?.trim()) return null;
    if (typeof data.loginEm !== "number") return null;
    return {
      funcionarioId: data.funcionarioId.trim(),
      nome: data.nome.trim(),
      loginEm: data.loginEm,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export async function obterSessaoPortalNotas(): Promise<PortalNotasSession | null> {
  const secret = getPortalNotasAccessCode();
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_NOTAS_COOKIE)?.value;
  if (!token) return null;

  return verificarTokenSessaoPortal(token, secret);
}

export function opcoesCookiePortalNotas() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/portal",
    maxAge: PORTAL_NOTAS_SESSION_MAX_AGE_SEC,
  };
}

export async function exigirSessaoPortalNotas(): Promise<PortalNotasSession> {
  const sessao = await obterSessaoPortalNotas();
  if (!sessao) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return sessao;
}

export function validarSenhaPortal(
  senhaInformada: string,
  secret: string
): boolean {
  const informado = senhaInformada;
  const esperado = secret;
  if (!informado || !esperado) return false;
  if (informado.length !== esperado.length) return false;
  try {
    return timingSafeEqual(Buffer.from(informado), Buffer.from(esperado));
  } catch {
    return false;
  }
}

export { assertPortalNotasConfigured };
