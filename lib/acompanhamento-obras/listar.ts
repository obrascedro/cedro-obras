import type { SupabaseClient } from "@supabase/supabase-js";
import { rotuloEtapa } from "@/lib/acompanhamento-obras/etapas";
import type {
  AcompanhamentoDetalhe,
  AcompanhamentoFoto,
  AcompanhamentoResumo,
} from "@/lib/acompanhamento-obras/types";

const SELECT_RESUMO = `
  id,
  obra_id,
  funcionario_id,
  etapa,
  etapa_outro,
  observacao,
  observacao_funcionario,
  data_atualizacao,
  criado_em,
  ativo,
  obras(nome),
  portal_funcionarios(nome),
  acompanhamento_obras_fotos(count)
`;

const SELECT_FOTOS = `
  acompanhamento_obras_fotos(id, storage_path, nome_original, mime_type, tamanho_bytes)
`;

function mapResumo(row: Record<string, unknown>): AcompanhamentoResumo {
  const obras = row.obras as { nome: string } | { nome: string }[] | null;
  const pf = row.portal_funcionarios as
    | { nome: string }
    | { nome: string }[]
    | null;
  const fotosCount = row.acompanhamento_obras_fotos as
    | { count: number }[]
    | null;

  const obraNome = Array.isArray(obras) ? obras[0]?.nome : obras?.nome;
  const funcNome = Array.isArray(pf) ? pf[0]?.nome : pf?.nome;

  const obsFunc =
    (row.observacao_funcionario as string | null)?.trim() ||
    (row.observacao as string | null)?.trim() ||
    null;

  return {
    id: String(row.id),
    obra_id: String(row.obra_id),
    obra_nome: obraNome ?? "—",
    funcionario_id: String(row.funcionario_id),
    funcionario_nome: funcNome ?? "—",
    etapa: rotuloEtapa(String(row.etapa), row.etapa_outro as string | null),
    etapa_codigo: String(row.etapa),
    etapa_outro: (row.etapa_outro as string | null) ?? null,
    observacao: obsFunc,
    observacao_funcionario: obsFunc,
    data_atualizacao: String(row.data_atualizacao),
    criado_em: String(row.criado_em),
    ativo: Boolean(row.ativo),
    total_fotos: fotosCount?.[0]?.count ?? 0,
  };
}

function mapFotos(raw: unknown): AcompanhamentoFoto[] {
  const fotosRaw = raw as Record<string, unknown>[] | null;
  return (fotosRaw ?? []).map((f) => ({
    id: String(f.id),
    storage_path: String(f.storage_path),
    nome_original: (f.nome_original as string | null) ?? null,
    mime_type: (f.mime_type as string | null) ?? null,
    tamanho_bytes: (f.tamanho_bytes as number | null) ?? null,
  }));
}

function mapDetalhe(row: Record<string, unknown>): AcompanhamentoDetalhe {
  const resumo = mapResumo(row);
  return {
    ...resumo,
    fotos: mapFotos(row.acompanhamento_obras_fotos),
  };
}

export async function listarAcompanhamentosPortal(
  supabase: SupabaseClient,
  funcionarioId: string
): Promise<AcompanhamentoResumo[]> {
  const { data, error } = await supabase
    .from("acompanhamento_obras")
    .select(SELECT_RESUMO)
    .eq("funcionario_id", funcionarioId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[acompanhamento] listarPortal.erro", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapResumo(row as Record<string, unknown>));
}

export async function obterAcompanhamentoPortal(
  supabase: SupabaseClient,
  id: string,
  funcionarioId: string
): Promise<AcompanhamentoDetalhe | null> {
  const { data, error } = await supabase
    .from("acompanhamento_obras")
    .select(`${SELECT_RESUMO}, ${SELECT_FOTOS}`)
    .eq("id", id)
    .eq("funcionario_id", funcionarioId)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error("[acompanhamento] obterPortal.erro", error.message);
    return null;
  }
  if (!data) return null;

  return mapDetalhe(data as Record<string, unknown>);
}

export type FiltrosAcompanhamentoAdmin = {
  obraId?: string;
  funcionarioId?: string;
  etapa?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  ordenacao?: "recentes" | "antigas";
  incluirInativos?: boolean;
};

export async function listarAcompanhamentosAdmin(
  supabase: SupabaseClient,
  filtros: FiltrosAcompanhamentoAdmin = {}
): Promise<AcompanhamentoResumo[]> {
  let query = supabase.from("acompanhamento_obras").select(SELECT_RESUMO);

  if (!filtros.incluirInativos) {
    query = query.eq("ativo", true);
  }

  if (filtros.obraId) query = query.eq("obra_id", filtros.obraId);
  if (filtros.funcionarioId) {
    query = query.eq("funcionario_id", filtros.funcionarioId);
  }
  if (filtros.etapa) query = query.eq("etapa", filtros.etapa);
  if (filtros.dataInicio) {
    query = query.gte("data_atualizacao", filtros.dataInicio);
  }
  if (filtros.dataFim) {
    query = query.lte("data_atualizacao", filtros.dataFim);
  }
  if (filtros.busca?.trim()) {
    const termo = filtros.busca.trim();
    query = query.or(
      `observacao_funcionario.ilike.%${termo}%,observacao.ilike.%${termo}%`
    );
  }

  query = query.order("criado_em", {
    ascending: filtros.ordenacao === "antigas",
  });

  const { data, error } = await query.limit(200);

  if (error) {
    console.error("[acompanhamento] listarAdmin.erro", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapResumo(row as Record<string, unknown>));
}

export async function obterAcompanhamentoAdmin(
  supabase: SupabaseClient,
  id: string
): Promise<AcompanhamentoDetalhe | null> {
  const { data, error } = await supabase
    .from("acompanhamento_obras")
    .select(`${SELECT_RESUMO}, ${SELECT_FOTOS}`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[acompanhamento] obterAdmin.erro", error.message, error.details);
    return null;
  }
  if (!data) return null;

  return mapDetalhe(data as Record<string, unknown>);
}

/** Detalhe via service role — somente após requireAdminSession no caller. */
export async function obterAcompanhamentoAdminBypass(
  supabase: SupabaseClient,
  id: string
): Promise<AcompanhamentoDetalhe | null> {
  const { data: registro, error: regError } = await supabase
    .from("acompanhamento_obras")
    .select(SELECT_RESUMO)
    .eq("id", id)
    .maybeSingle();

  if (regError || !registro) {
    console.error("[acompanhamento] obterAdminBypass.registro", regError?.message);
    return null;
  }

  const { data: fotos, error: fotosError } = await supabase
    .from("acompanhamento_obras_fotos")
    .select("id, storage_path, nome_original, mime_type, tamanho_bytes")
    .eq("acompanhamento_id", id)
    .order("criado_em", { ascending: true });

  if (fotosError) {
    console.error("[acompanhamento] obterAdminBypass.fotos", fotosError.message);
    return null;
  }

  return mapDetalhe({
    ...(registro as Record<string, unknown>),
    acompanhamento_obras_fotos: fotos ?? [],
  });
}

export async function listarAcompanhamentosPorObra(
  supabase: SupabaseClient,
  obraId: string
): Promise<AcompanhamentoResumo[]> {
  const { data, error } = await supabase
    .from("acompanhamento_obras")
    .select(SELECT_RESUMO)
    .eq("obra_id", obraId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[acompanhamento] listarPorObra.erro", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapResumo(row as Record<string, unknown>));
}

export type DashboardAcompanhamentoStats = {
  totalUltimos7Dias: number;
  ultimaObraNome: string | null;
  ultimoFuncionarioNome: string | null;
};

export async function obterStatsDashboardAcompanhamento(
  supabase: SupabaseClient,
  options?: { obraId?: string }
): Promise<DashboardAcompanhamentoStats> {
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const desde = seteDiasAtras.toISOString();

  let countQuery = supabase
    .from("acompanhamento_obras")
    .select("id", { count: "exact", head: true })
    .eq("ativo", true)
    .gte("criado_em", desde);

  let ultimaQuery = supabase
    .from("acompanhamento_obras")
    .select(SELECT_RESUMO)
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(1);

  if (options?.obraId) {
    countQuery = countQuery.eq("obra_id", options.obraId);
    ultimaQuery = ultimaQuery.eq("obra_id", options.obraId);
  }

  const [{ count }, { data: ultima }] = await Promise.all([
    countQuery,
    ultimaQuery.maybeSingle(),
  ]);

  if (!ultima) {
    return {
      totalUltimos7Dias: count ?? 0,
      ultimaObraNome: null,
      ultimoFuncionarioNome: null,
    };
  }

  const resumo = mapResumo(ultima as Record<string, unknown>);
  return {
    totalUltimos7Dias: count ?? 0,
    ultimaObraNome: resumo.obra_nome,
    ultimoFuncionarioNome: resumo.funcionario_nome,
  };
}
