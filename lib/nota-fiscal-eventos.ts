import type { SupabaseClient } from "@supabase/supabase-js";

export type AcaoNotaFiscalEvento =
  | "enviada"
  | "processada_ia"
  | "editada"
  | "aprovada"
  | "rejeitada"
  | "correcao_solicitada"
  | "reenviada";

type RegistrarEventoParams = {
  notaId: string;
  acao: AcaoNotaFiscalEvento;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  detalhes?: Record<string, unknown>;
};

export async function registrarEventoNotaFiscal(
  client: SupabaseClient,
  params: RegistrarEventoParams
): Promise<void> {
  const { error } = await client.from("notas_fiscais_eventos").insert({
    nota_id: params.notaId,
    acao: params.acao,
    usuario_id: params.usuarioId ?? null,
    usuario_nome: params.usuarioNome ?? null,
    detalhes: params.detalhes ?? {},
  });

  if (error) {
    console.error("[NotaFiscal] evento.erro", error.message);
  }
}

export async function listarEventosNotaFiscal(
  client: SupabaseClient,
  notaId: string
) {
  const { data, error } = await client
    .from("notas_fiscais_eventos")
    .select("id, acao, usuario_nome, detalhes, criado_em")
    .eq("nota_id", notaId)
    .order("criado_em", { ascending: true });

  if (error) return [];
  return data ?? [];
}
