import type { SupabaseClient } from "@supabase/supabase-js";

export type PortalFuncionario = {
  id: string;
  nome: string;
  ativo: boolean;
};

export async function listarFuncionariosPortalAtivos(
  supabase: SupabaseClient
): Promise<PortalFuncionario[]> {
  const { data, error } = await supabase
    .from("portal_funcionarios")
    .select("id, nome, ativo")
    .eq("ativo", true)
    .order("nome");

  if (error) {
    console.error("[Portal] funcionarios.listar.erro", error.message);
    return [];
  }

  return (data ?? []) as PortalFuncionario[];
}

export async function buscarFuncionarioPortalPorId(
  supabase: SupabaseClient,
  funcionarioId: string
): Promise<PortalFuncionario | null> {
  const { data, error } = await supabase
    .from("portal_funcionarios")
    .select("id, nome, ativo")
    .eq("id", funcionarioId)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.ativo) return null;
  return data as PortalFuncionario;
}
