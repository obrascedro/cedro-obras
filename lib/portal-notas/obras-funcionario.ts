import type { SupabaseClient } from "@supabase/supabase-js";

export type ObraAutorizada = { id: string; nome: string };

export type ListarObrasAutorizadasResult = {
  obras: ObraAutorizada[];
  /** Código interno — não exibir ao funcionário */
  codigoErro?: "tabela_ausente" | "consulta_falhou";
};

const OBRAS_STATUS_BLOQUEADOS = new Set(["Cancelada"]);

function isTabelaAusente(message: string): boolean {
  return (
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

function extrairObra(raw: unknown): ObraAutorizada | null {
  const obra = (Array.isArray(raw) ? raw[0] : raw) as {
    id: string;
    nome: string;
    status?: string | null;
  } | null;

  if (!obra?.id || !obra.nome) return null;
  if (obra.status && OBRAS_STATUS_BLOQUEADOS.has(obra.status)) return null;

  return { id: obra.id, nome: obra.nome };
}

/** Verifica se o funcionário pode enviar nota para a obra (A-07). */
export async function funcionarioPodeEnviarNotaParaObra(
  supabase: SupabaseClient,
  funcionarioId: string,
  obraId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("funcionario_obras")
    .select("obra_id", { count: "exact", head: true })
    .eq("funcionario_id", funcionarioId)
    .eq("obra_id", obraId)
    .eq("ativo", true);

  if (error) {
    console.error("[portal] funcionarioPodeEnviarNotaParaObra:", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

/** Lista obras autorizadas para o funcionário no portal (sessão autenticada + RLS). */
export async function listarObrasAutorizadasFuncionario(
  supabase: SupabaseClient,
  funcionarioId: string
): Promise<ListarObrasAutorizadasResult> {
  if (!funcionarioId) {
    console.error("[portal] listarObrasAutorizadas: funcionario_id vazio");
    return { obras: [], codigoErro: "consulta_falhou" };
  }

  const { data, error } = await supabase
    .from("funcionario_obras")
    .select("ativo, obras(id, nome, status)")
    .eq("funcionario_id", funcionarioId)
    .eq("ativo", true);

  if (error) {
    const msg = error.message;
    const codigo = isTabelaAusente(msg) ? "tabela_ausente" : "consulta_falhou";
    console.error(
      `[portal] listarObrasAutorizadas funcionario_id=${funcionarioId}:`,
      msg,
      error.details ?? "",
      error.hint ?? ""
    );
    return { obras: [], codigoErro: codigo };
  }

  const obras: ObraAutorizada[] = [];
  for (const row of data ?? []) {
    const obra = extrairObra(row.obras);
    if (obra) obras.push(obra);
  }

  return {
    obras: obras.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  };
}
