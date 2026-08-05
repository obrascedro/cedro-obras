import type { SupabaseClient } from "@supabase/supabase-js";

export type ObraRecebimento = {
  id: string;
  obra_id: string;
  valor: number;
  data_recebimento: string;
  descricao: string | null;
  origem: string | null;
  criado_em: string;
  criado_por: string | null;
};

function mapRecebimento(row: Record<string, unknown>): ObraRecebimento {
  return {
    id: String(row.id),
    obra_id: String(row.obra_id),
    valor: Number(row.valor ?? 0),
    data_recebimento: String(row.data_recebimento),
    descricao: (row.descricao as string | null) ?? null,
    origem: (row.origem as string | null) ?? null,
    criado_em: String(row.criado_em),
    criado_por: (row.criado_por as string | null) ?? null,
  };
}

export async function listarRecebimentosObra(
  client: SupabaseClient,
  obraId: string
): Promise<ObraRecebimento[]> {
  const { data, error } = await client
    .from("obra_recebimentos")
    .select(
      "id, obra_id, valor, data_recebimento, descricao, origem, criado_em, criado_por"
    )
    .eq("obra_id", obraId)
    .order("data_recebimento", { ascending: false })
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[obra/recebimentos] listar.erro", error.message);
    throw new Error("Não foi possível carregar os recebimentos.");
  }

  return (data ?? []).map((row) =>
    mapRecebimento(row as Record<string, unknown>)
  );
}

export async function somarRecebimentosObra(
  client: SupabaseClient,
  obraId: string
): Promise<number> {
  const { data, error } = await client
    .from("obra_recebimentos")
    .select("valor")
    .eq("obra_id", obraId);

  if (error) {
    console.error("[obra/recebimentos] somar.erro", error.message);
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.valor ?? 0), 0);
}
