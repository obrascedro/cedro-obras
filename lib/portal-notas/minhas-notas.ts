import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADMIN_ROLE,
  FUNCIONARIO_ROLE,
  type AppSession,
} from "@/lib/auth";
import type { NotaFiscalItemExtraido } from "@/lib/nota-fiscal-ia";

export type NotaFuncionarioResumo = {
  id: string;
  obra_id: string;
  obra_nome: string;
  arquivo_nome: string;
  arquivo_tipo: string | null;
  fornecedor: string | null;
  valor_total: number | null;
  status_processamento: string;
  criado_em: string;
};

export type NotaFuncionarioDetalhe = NotaFuncionarioResumo & {
  arquivo_path: string;
  data_nota: string | null;
  observacoes: string | null;
  motivo_rejeicao: string | null;
  itens_json: NotaFiscalItemExtraido[] | null;
  auth_user_id: string | null;
};

const COLUNAS_RESUMO =
  "id, obra_id, arquivo_nome, arquivo_tipo, fornecedor, valor_total, status_processamento, criado_em, obras(nome)";

const COLUNAS_DETALHE = `${COLUNAS_RESUMO}, arquivo_path, data_nota, observacoes, motivo_rejeicao, itens_json, auth_user_id, funcionario_id`;

function mapObraNome(
  obras: { nome: string } | { nome: string }[] | null | undefined
): string {
  if (!obras) return "—";
  if (Array.isArray(obras)) return obras[0]?.nome ?? "—";
  return obras.nome;
}

function mapResumo(row: Record<string, unknown>): NotaFuncionarioResumo {
  return {
    id: String(row.id),
    obra_id: String(row.obra_id),
    obra_nome: mapObraNome(
      row.obras as { nome: string } | { nome: string }[] | null | undefined
    ),
    arquivo_nome: String(row.arquivo_nome),
    arquivo_tipo: (row.arquivo_tipo as string | null) ?? null,
    fornecedor: (row.fornecedor as string | null) ?? null,
    valor_total: row.valor_total != null ? Number(row.valor_total) : null,
    status_processamento: String(row.status_processamento),
    criado_em: String(row.criado_em),
  };
}

function parseItensJson(raw: unknown): NotaFiscalItemExtraido[] | null {
  if (!raw || !Array.isArray(raw)) return null;
  return raw as NotaFiscalItemExtraido[];
}

export async function listarNotasDoFuncionario(
  supabase: SupabaseClient,
  session: AppSession
): Promise<NotaFuncionarioResumo[]> {
  let query = supabase
    .from("notas_fiscais")
    .select(COLUNAS_RESUMO)
    .eq("origem", "portal_funcionario")
    .order("criado_em", { ascending: false });

  if (session.role === FUNCIONARIO_ROLE) {
    if (session.funcionario_id) {
      query = query.or(
        `auth_user_id.eq.${session.userId},funcionario_id.eq.${session.funcionario_id}`
      );
    } else {
      query = query.eq("auth_user_id", session.userId);
    }
  }

  const { data, error } = await query;

  if (error) {
    if (
      error.message.includes("auth_user_id") &&
      session.funcionario_id
    ) {
      const fallback = await supabase
        .from("notas_fiscais")
        .select(COLUNAS_RESUMO)
        .eq("origem", "portal_funcionario")
        .eq("funcionario_id", session.funcionario_id)
        .order("criado_em", { ascending: false });

      if (fallback.error) {
        console.error("[MinhasNotas] listar.erro", fallback.error.message);
        return [];
      }

      return (fallback.data ?? []).map((row) =>
        mapResumo(row as Record<string, unknown>)
      );
    }

    console.error("[MinhasNotas] listar.erro", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapResumo(row as Record<string, unknown>)
  );
}

export async function obterNotaDoFuncionario(
  supabase: SupabaseClient,
  session: AppSession,
  notaId: string
): Promise<NotaFuncionarioDetalhe | null> {
  const { data, error } = await supabase
    .from("notas_fiscais")
    .select(COLUNAS_DETALHE)
    .eq("id", notaId)
    .eq("origem", "portal_funcionario")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[MinhasNotas] obter.erro", error.message);
    return null;
  }

  const row = data as Record<string, unknown>;

  if (
    session.role === FUNCIONARIO_ROLE &&
    row.auth_user_id !== session.userId
  ) {
    const funcionarioId = session.funcionario_id;
    const rowFuncionarioId = row.funcionario_id as string | null | undefined;
    if (!funcionarioId || rowFuncionarioId !== funcionarioId) {
      return null;
    }
  }

  if (session.role === ADMIN_ROLE) {
    // Admin pode visualizar para teste.
  }

  const resumo = mapResumo(row);

  return {
    ...resumo,
    arquivo_path: String(row.arquivo_path),
    data_nota: (row.data_nota as string | null) ?? null,
    observacoes: (row.observacoes as string | null) ?? null,
    motivo_rejeicao: (row.motivo_rejeicao as string | null) ?? null,
    itens_json: parseItensJson(row.itens_json),
    auth_user_id: (row.auth_user_id as string | null) ?? null,
  };
}
