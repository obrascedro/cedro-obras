"use server";

import { requireAdminSession } from "@/lib/auth";
import {
  AUDIT_MODULOS,
  type AuditLogRow,
} from "@/lib/audit-constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AuditoriaFiltros = {
  de?: string;
  ate?: string;
  usuarioId?: string;
  modulo?: string;
  acao?: string;
  busca?: string;
  limite?: number;
};

const LIMITE_PADRAO = 500;

export async function listarAuditoriaAdminAction(
  filtros: AuditoriaFiltros = {}
): Promise<AuditLogRow[]> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filtros.limite ?? LIMITE_PADRAO);

  if (filtros.de) {
    query = query.gte("created_at", filtros.de);
  }

  if (filtros.ate) {
    const ate = filtros.ate.includes("T")
      ? filtros.ate
      : `${filtros.ate}T23:59:59.999Z`;
    query = query.lte("created_at", ate);
  }

  if (filtros.usuarioId) {
    query = query.eq("usuario_id", filtros.usuarioId);
  }

  if (filtros.modulo) {
    query = query.eq("modulo", filtros.modulo);
  }

  if (filtros.acao) {
    query = query.eq("acao", filtros.acao);
  }

  if (filtros.busca?.trim()) {
    query = query.ilike("descricao", `%${filtros.busca.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditLogRow[];
}

export async function exportarAuditoriaCsvAction(
  filtros: AuditoriaFiltros = {}
): Promise<string> {
  const logs = await listarAuditoriaAdminAction({
    ...filtros,
    limite: 10000,
  });

  const header = [
    "Data/Hora",
    "Usuário",
    "E-mail",
    "Perfil",
    "Módulo",
    "Ação",
    "Descrição",
    "Tabela",
    "Registro ID",
    "IP",
  ];

  const linhas = logs.map((log) =>
    [
      log.created_at,
      log.usuario_nome,
      log.usuario_email ?? "",
      log.usuario_role ?? "",
      log.modulo,
      log.acao,
      log.descricao,
      log.tabela ?? "",
      log.registro_id ?? "",
      log.ip ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );

  return [header.join(","), ...linhas].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function listarModulosAuditoriaAction(): Promise<string[]> {
  await requireAdminSession();
  return [...AUDIT_MODULOS];
}

export async function listarUsuariosAuditoriaAction(): Promise<
  { id: string; nome: string }[]
> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("usuario_id, usuario_nome")
    .not("usuario_id", "is", null)
    .order("usuario_nome");

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.usuario_id) {
      map.set(row.usuario_id, row.usuario_nome);
    }
  }

  return Array.from(map.entries())
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function listarAcoesAuditoriaAction(
  modulo?: string
): Promise<string[]> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("audit_logs").select("acao").order("acao");

  if (modulo) {
    query = query.eq("modulo", modulo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => row.acao))].sort();
}
