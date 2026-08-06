import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ObraFiltroOpcao = {
  id: string;
  nome: string;
  status: string;
};

export type ObraFiltroResolvido = {
  obraId: string | null;
  obraSelecionada: ObraFiltroOpcao | null;
  redirectParaTodas: boolean;
};

export function isObraIdValido(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Interpreta ?obra= da URL. Retorna null para visão geral. */
export function parseObraQueryParam(raw?: string | null): string | null | "invalido" {
  const value = raw?.trim();
  if (!value || value.toLowerCase() === "todas") {
    return null;
  }
  if (!isObraIdValido(value)) {
    return "invalido";
  }
  return value;
}

/** Obras disponíveis no seletor — exclui canceladas, ordenadas por nome. */
export async function listarObrasParaFiltroDashboard(
  supabase: SupabaseClient
): Promise<ObraFiltroOpcao[]> {
  const { data, error } = await supabase
    .from("obras")
    .select("id, nome, status")
    .neq("status", "Cancelada")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[dashboard] listarObrasFiltro.erro", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
    status: String(row.status ?? "Em andamento"),
  }));
}

/** Valida obra_id no servidor contra obras existentes (RLS aplicado). */
export async function resolverFiltroObraDashboard(
  supabase: SupabaseClient,
  rawObraParam: string | undefined,
  obrasOpcoes: ObraFiltroOpcao[]
): Promise<ObraFiltroResolvido> {
  const parsed = parseObraQueryParam(rawObraParam);

  if (parsed === "invalido") {
    return { obraId: null, obraSelecionada: null, redirectParaTodas: true };
  }

  if (!parsed) {
    return { obraId: null, obraSelecionada: null, redirectParaTodas: false };
  }

  const obra = obrasOpcoes.find((item) => item.id === parsed);
  if (!obra) {
    return { obraId: null, obraSelecionada: null, redirectParaTodas: true };
  }

  return { obraId: parsed, obraSelecionada: obra, redirectParaTodas: false };
}

export function calcularPercentualOrcamentoUtilizado(
  orcamento: number | null | undefined,
  gasto: number
): number | null {
  if (orcamento == null || orcamento <= 0) {
    return null;
  }
  return Math.min(999, Math.round((gasto / orcamento) * 100));
}
