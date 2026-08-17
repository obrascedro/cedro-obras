import type { SupabaseClient } from "@supabase/supabase-js";
import { etapasCorrespondem } from "@/lib/gastos-etapa";

export type GastoObraRow = {
  id: string;
  obra_id: string;
  etapa: string;
  categoria: string;
  descricao: string;
  fornecedor: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number | null;
  data_gasto: string | null;
  origem: string | null;
  ativo: boolean;
};

const GASTO_OBRA_SELECT =
  "id, obra_id, etapa, categoria, descricao, fornecedor, quantidade, valor_unitario, valor_total, data_gasto, origem, ativo";

function mapGastoObra(row: Record<string, unknown>): GastoObraRow {
  return {
    id: String(row.id),
    obra_id: String(row.obra_id),
    etapa: String(row.etapa ?? ""),
    categoria: String(row.categoria ?? ""),
    descricao: String(row.descricao ?? ""),
    fornecedor: (row.fornecedor as string | null) ?? null,
    quantidade:
      row.quantidade != null ? Number(row.quantidade) : null,
    valor_unitario:
      row.valor_unitario != null ? Number(row.valor_unitario) : null,
    valor_total: row.valor_total != null ? Number(row.valor_total) : null,
    data_gasto: (row.data_gasto as string | null) ?? null,
    origem: (row.origem as string | null) ?? "manual",
    ativo: row.ativo !== false,
  };
}

/** Soma gastos ativos da obra — fonte única de verdade para gasto realizado. */
export async function somarGastosObra(
  client: SupabaseClient,
  obraId: string
): Promise<number> {
  const { data, error } = await client
    .from("gastos_obra")
    .select("valor_total")
    .eq("obra_id", obraId)
    .eq("ativo", true);

  if (error) {
    console.error("[gastos-obra] somar.erro", error.message);
    throw error;
  }

  return (data ?? []).reduce(
    (sum, row) => sum + Number(row.valor_total ?? 0),
    0
  );
}

export async function listarGastosObra(
  client: SupabaseClient,
  obraId: string
): Promise<GastoObraRow[]> {
  const { data, error } = await client
    .from("gastos_obra")
    .select(GASTO_OBRA_SELECT)
    .eq("obra_id", obraId)
    .eq("ativo", true)
    .order("data_gasto", { ascending: false })
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[gastos-obra] listar.erro", error.message);
    throw error;
  }

  return (data ?? []).map((row) =>
    mapGastoObra(row as Record<string, unknown>)
  );
}

export async function listarGastosObraPorEtapa(
  client: SupabaseClient,
  obraId: string,
  etapa: string
): Promise<GastoObraRow[]> {
  const gastos = await listarGastosObra(client, obraId);
  return gastos.filter((gasto) => etapasCorrespondem(gasto.etapa, etapa));
}
