import "server-only";

import { headers } from "next/headers";
import type { AppSession } from "@/lib/auth";
import type { AuditModulo } from "@/lib/audit-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type { AuditLogRow, AuditModulo } from "@/lib/audit-constants";
export { AUDIT_MODULOS } from "@/lib/audit-constants";

export type RegistrarAuditoriaParams = {
  modulo: AuditModulo;
  acao: string;
  descricao: string;
  tabela?: string | null;
  registro_id?: string | null;
  usuario?: Pick<AppSession, "userId" | "nome" | "email" | "role"> | null;
  ip?: string | null;
  user_agent?: string | null;
};

export async function obterContextoAuditoria(): Promise<{
  ip: string | null;
  user_agent: string | null;
}> {
  try {
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
    return {
      ip: forwarded || hdrs.get("x-real-ip") || null,
      user_agent: hdrs.get("user-agent"),
    };
  } catch {
    return { ip: null, user_agent: null };
  }
}

/**
 * Registra log de auditoria sem bloquear o fluxo principal.
 * Usa service role para insert (funcionários não podem gravar logs diretamente).
 */
export async function registrarAuditoria(
  params: RegistrarAuditoriaParams
): Promise<void> {
  try {
    const ctx = await obterContextoAuditoria();
    const admin = createSupabaseAdminClient();

    const usuario = params.usuario;

    const { error } = await admin.from("audit_logs").insert({
      usuario_id: usuario?.userId ?? null,
      usuario_nome: usuario?.nome ?? "Sistema",
      usuario_email: usuario?.email ?? null,
      usuario_role: usuario?.role ?? null,
      modulo: params.modulo,
      acao: params.acao,
      descricao: params.descricao.slice(0, 2000),
      tabela: params.tabela ?? null,
      registro_id: params.registro_id ?? null,
      ip: params.ip ?? ctx.ip,
      user_agent: params.user_agent ?? ctx.user_agent,
    });

    if (error) {
      console.error("[Auditoria] insert.erro", error.message, params.acao);
    }
  } catch (error) {
    console.error(
      "[Auditoria] falha",
      error instanceof Error ? error.message : error,
      params.acao
    );
  }
}

export async function registrarAuditoriaSessao(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: Omit<RegistrarAuditoriaParams, "usuario">
): Promise<void> {
  return registrarAuditoria({ ...params, usuario: session });
}

export function formatReferenciaAuditoria(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function formatMoedaAuditoria(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/** Evita logs duplicados na mesma requisição (ex.: aprovação + alteração de campo). */
const dedupeKeys = new Set<string>();

export function chaveDedupeAuditoria(parts: string[]): string {
  return parts.join("|");
}

export async function registrarAuditoriaDedupe(
  chave: string,
  params: RegistrarAuditoriaParams
): Promise<void> {
  if (dedupeKeys.has(chave)) return;
  dedupeKeys.add(chave);
  await registrarAuditoria(params);
  setTimeout(() => dedupeKeys.delete(chave), 5000);
}
