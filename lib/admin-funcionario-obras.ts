import type { SupabaseClient } from "@supabase/supabase-js";

export type ObraAdminOption = {
  id: string;
  nome: string;
  status: string;
};

export type SalvarObrasAutorizadasResult = {
  adicionadas: string[];
  removidas: string[];
  reativadas: string[];
};

const OBRAS_STATUS_BLOQUEADOS = new Set(["Cancelada"]);

type VinculoRow = {
  id: string;
  obra_id: string;
  ativo: boolean;
};

/** Lista obras disponíveis para vínculo (exclui canceladas). */
export async function listarObrasDisponiveisAdmin(
  admin: SupabaseClient
): Promise<ObraAdminOption[]> {
  const { data, error } = await admin
    .from("obras")
    .select("id, nome, status")
    .order("nome");

  if (error) {
    console.error("[AdminFuncionarioObras] listarObras.erro", error.message);
    throw new Error("Não foi possível carregar a lista de obras.");
  }

  return (data ?? [])
    .filter(
      (row) =>
        row.id &&
        row.nome &&
        !OBRAS_STATUS_BLOQUEADOS.has(String(row.status ?? ""))
    )
    .map((row) => ({
      id: String(row.id),
      nome: String(row.nome),
      status: String(row.status ?? "Em andamento"),
    }));
}

/** IDs das obras com vínculo ativo para o funcionário. */
export async function listarObrasAutorizadasIdsAdmin(
  admin: SupabaseClient,
  funcionarioId: string
): Promise<string[]> {
  if (!funcionarioId) return [];

  const { data, error } = await admin
    .from("funcionario_obras")
    .select("obra_id")
    .eq("funcionario_id", funcionarioId)
    .eq("ativo", true);

  if (error) {
    if (isTabelaAusente(error.message)) {
      console.error(
        "[AdminFuncionarioObras] Tabela funcionario_obras ausente:",
        error.message
      );
      throw new Error(
        "A tabela de vínculos ainda não foi criada. Execute supabase/funcionario-obras.sql no Supabase."
      );
    }
    console.error(
      "[AdminFuncionarioObras] listarAutorizadas.erro",
      error.message
    );
    throw new Error("Não foi possível carregar as obras autorizadas.");
  }

  return (data ?? []).map((row) => String(row.obra_id));
}

function isTabelaAusente(message: string): boolean {
  return (
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

/** Valida que todos os IDs pertencem a obras existentes e não canceladas. */
export async function validarObraIdsAdmin(
  admin: SupabaseClient,
  obraIds: string[]
): Promise<void> {
  if (obraIds.length === 0) return;

  const { data, error } = await admin
    .from("obras")
    .select("id, status")
    .in("id", obraIds);

  if (error) {
    throw new Error("Não foi possível validar as obras selecionadas.");
  }

  const validas = new Set(
    (data ?? [])
      .filter((row) => !OBRAS_STATUS_BLOQUEADOS.has(String(row.status ?? "")))
      .map((row) => String(row.id))
  );

  const invalidas = obraIds.filter((id) => !validas.has(id));
  if (invalidas.length > 0) {
    throw new Error("Uma ou mais obras selecionadas são inválidas ou canceladas.");
  }
}

/**
 * Sincroniza vínculos funcionário ↔ obras:
 * - insere novos;
 * - reativa inativos;
 * - desativa desmarcados (soft delete — preserva histórico de notas).
 */
export async function salvarObrasAutorizadasAdmin(
  admin: SupabaseClient,
  funcionarioId: string,
  obraIdsSelecionadas: string[]
): Promise<SalvarObrasAutorizadasResult> {
  const selecionadas = [...new Set(obraIdsSelecionadas.filter(Boolean))];

  await validarObraIdsAdmin(admin, selecionadas);

  const { data: vinculosAtuais, error: vinculosError } = await admin
    .from("funcionario_obras")
    .select("id, obra_id, ativo")
    .eq("funcionario_id", funcionarioId);

  if (vinculosError) {
    if (isTabelaAusente(vinculosError.message)) {
      throw new Error(
        "A tabela de vínculos ainda não foi criada. Execute supabase/funcionario-obras.sql no Supabase."
      );
    }
    throw new Error("Não foi possível consultar os vínculos atuais.");
  }

  const mapaAtual = new Map<string, VinculoRow>();
  for (const row of vinculosAtuais ?? []) {
    mapaAtual.set(String(row.obra_id), {
      id: String(row.id),
      obra_id: String(row.obra_id),
      ativo: Boolean(row.ativo),
    });
  }

  const ativosAtuais = new Set(
    [...mapaAtual.values()].filter((v) => v.ativo).map((v) => v.obra_id)
  );
  const selecionadasSet = new Set(selecionadas);

  const adicionadas: string[] = [];
  const reativadas: string[] = [];
  const removidas: string[] = [];

  for (const obraId of selecionadas) {
    const existente = mapaAtual.get(obraId);
    if (!existente) {
      const { error } = await admin.from("funcionario_obras").insert({
        funcionario_id: funcionarioId,
        obra_id: obraId,
        ativo: true,
      });
      if (error) {
        console.error("[AdminFuncionarioObras] insert.erro", error.message);
        throw new Error("Erro ao vincular obra. Tente novamente.");
      }
      adicionadas.push(obraId);
    } else if (!existente.ativo) {
      const { error } = await admin
        .from("funcionario_obras")
        .update({ ativo: true })
        .eq("id", existente.id);
      if (error) {
        console.error("[AdminFuncionarioObras] reativar.erro", error.message);
        throw new Error("Erro ao reativar vínculo. Tente novamente.");
      }
      reativadas.push(obraId);
    }
  }

  for (const obraId of ativosAtuais) {
    if (!selecionadasSet.has(obraId)) {
      const existente = mapaAtual.get(obraId);
      if (!existente) continue;

      const { error } = await admin
        .from("funcionario_obras")
        .update({ ativo: false })
        .eq("id", existente.id);
      if (error) {
        console.error("[AdminFuncionarioObras] desativar.erro", error.message);
        throw new Error("Erro ao remover acesso à obra. Tente novamente.");
      }
      removidas.push(obraId);
    }
  }

  return { adicionadas, removidas, reativadas };
}

/** Nomes das obras por ID (para auditoria). */
export async function nomesObrasPorIdsAdmin(
  admin: SupabaseClient,
  obraIds: string[]
): Promise<Map<string, string>> {
  if (obraIds.length === 0) return new Map();

  const { data } = await admin
    .from("obras")
    .select("id, nome")
    .in("id", obraIds);

  const mapa = new Map<string, string>();
  for (const row of data ?? []) {
    mapa.set(String(row.id), String(row.nome));
  }
  return mapa;
}
