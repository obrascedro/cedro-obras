import type { SupabaseClient } from "@supabase/supabase-js";

export const CATEGORIAS_ANOTACAO_SUGESTOES = [
  "Pessoal",
  "A receber",
  "A pagar",
  "Empréstimo",
  "Lembrete",
  "Pagos",
  "Outros",
] as const;

export type AnotacaoPessoalRow = {
  id: string;
  user_id: string;
  data: string;
  descricao: string;
  categoria: string | null;
  valor: number | null;
  observacao: string | null;
  criado_em: string;
  atualizado_em: string;
};

const ANOTACAO_SELECT =
  "id, user_id, data, descricao, categoria, valor, observacao, criado_em, atualizado_em";

function mapAnotacao(row: Record<string, unknown>): AnotacaoPessoalRow {
  const categoriaRaw = row.categoria as string | null | undefined;

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    data: String(row.data),
    descricao: String(row.descricao ?? ""),
    categoria: categoriaRaw?.trim() ? categoriaRaw.trim() : null,
    valor: row.valor != null ? Number(row.valor) : null,
    observacao: (row.observacao as string | null) ?? null,
    criado_em: String(row.criado_em),
    atualizado_em: String(row.atualizado_em),
  };
}

export async function listarAnotacoesPessoais(
  client: SupabaseClient,
  userId: string
): Promise<AnotacaoPessoalRow[]> {
  const { data, error } = await client
    .from("anotacoes_pessoais")
    .select(ANOTACAO_SELECT)
    .eq("user_id", userId)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[anotacoes-pessoais] listar.erro", error.message);
    throw error;
  }

  return (data ?? []).map((row) =>
    mapAnotacao(row as Record<string, unknown>)
  );
}

export function somarValoresAnotacoes(anotacoes: AnotacaoPessoalRow[]): number {
  return anotacoes.reduce((sum, item) => {
    if (item.valor == null) return sum;
    return sum + item.valor;
  }, 0);
}

/** Chave normalizada para comparar categorias (trim, acentos, caixa). */
export function normalizarCategoriaChave(
  valor: string | null | undefined
): string {
  if (!valor?.trim()) return "";

  return valor
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function categoriasAnotacaoCorrespondem(
  categoriaRegistro: string | null | undefined,
  categoriaFiltro: string
): boolean {
  if (!categoriaFiltro.trim()) return true;
  return (
    normalizarCategoriaChave(categoriaRegistro) ===
    normalizarCategoriaChave(categoriaFiltro)
  );
}

export type FiltrosAnotacoesPessoais = {
  busca?: string;
  categoria?: string;
  dataInicio?: string;
  dataFim?: string;
  ordenacao?: "recentes" | "antigos" | "maior_valor" | "menor_valor";
};

/** Aplica busca, categoria, datas e ordenação — fonte única para lista, total e contador. */
export function filtrarAnotacoesPessoais(
  anotacoes: AnotacaoPessoalRow[],
  filtros: FiltrosAnotacoesPessoais
): AnotacaoPessoalRow[] {
  let resultado = [...anotacoes];
  const termo = filtros.busca?.trim().toLowerCase() ?? "";

  if (termo) {
    resultado = resultado.filter((anotacao) =>
      anotacao.descricao.toLowerCase().includes(termo)
    );
  }

  if (filtros.categoria?.trim()) {
    resultado = resultado.filter((anotacao) =>
      categoriasAnotacaoCorrespondem(anotacao.categoria, filtros.categoria!)
    );
  }

  if (filtros.dataInicio) {
    resultado = resultado.filter(
      (anotacao) => anotacao.data >= filtros.dataInicio!
    );
  }

  if (filtros.dataFim) {
    resultado = resultado.filter(
      (anotacao) => anotacao.data <= filtros.dataFim!
    );
  }

  switch (filtros.ordenacao) {
    case "antigos":
      resultado.sort((a, b) => a.data.localeCompare(b.data));
      break;
    case "maior_valor":
      resultado.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
      break;
    case "menor_valor":
      resultado.sort((a, b) => (a.valor ?? 0) - (b.valor ?? 0));
      break;
    default:
      resultado.sort((a, b) => b.data.localeCompare(a.data));
  }

  return resultado;
}

/** Sugestões fixas + categorias já usadas nas anotações (para filtros e formulários). */
export function listarCategoriasAnotacao(
  anotacoes: AnotacaoPessoalRow[]
): string[] {
  const doBanco = anotacoes
    .map((a) => a.categoria?.trim())
    .filter(Boolean) as string[];

  const ordem = new Map(
    CATEGORIAS_ANOTACAO_SUGESTOES.map((cat, index) => [
      normalizarCategoriaChave(cat),
      index,
    ])
  );

  return [...new Set([...CATEGORIAS_ANOTACAO_SUGESTOES, ...doBanco])].sort(
    (a, b) => {
      const ordemA = ordem.get(normalizarCategoriaChave(a));
      const ordemB = ordem.get(normalizarCategoriaChave(b));

      if (ordemA != null && ordemB != null) return ordemA - ordemB;
      if (ordemA != null) return -1;
      if (ordemB != null) return 1;
      return a.localeCompare(b, "pt-BR");
    }
  );
}

/** Categorias extras cadastradas no banco e ausentes da lista padrão. */
export function listarCategoriasExtrasAnotacao(
  anotacoes: AnotacaoPessoalRow[]
): string[] {
  const padrao = new Set(
    CATEGORIAS_ANOTACAO_SUGESTOES.map((cat) => normalizarCategoriaChave(cat))
  );

  return [
    ...new Set(
      anotacoes
        .map((a) => a.categoria?.trim())
        .filter(Boolean) as string[]
    ),
  ]
    .filter((cat) => !padrao.has(normalizarCategoriaChave(cat)))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export type AnotacaoPessoalInput = {
  data: string;
  descricao: string;
  categoria?: string | null;
  valor?: number | null;
  observacao?: string | null;
};

export async function criarAnotacaoPessoal(
  client: SupabaseClient,
  userId: string,
  input: AnotacaoPessoalInput
): Promise<AnotacaoPessoalRow> {
  const { data, error } = await client
    .from("anotacoes_pessoais")
    .insert({
      user_id: userId,
      data: input.data,
      descricao: input.descricao,
      categoria: input.categoria?.trim() || null,
      valor: input.valor ?? null,
      observacao: input.observacao?.trim() || null,
    })
    .select(ANOTACAO_SELECT)
    .single();

  if (error) {
    console.error("[anotacoes-pessoais] criar.erro", error.message);
    throw error;
  }

  return mapAnotacao(data as Record<string, unknown>);
}

export async function atualizarAnotacaoPessoal(
  client: SupabaseClient,
  userId: string,
  id: string,
  input: AnotacaoPessoalInput
): Promise<AnotacaoPessoalRow> {
  const { data, error } = await client
    .from("anotacoes_pessoais")
    .update({
      data: input.data,
      descricao: input.descricao,
      categoria: input.categoria?.trim() || null,
      valor: input.valor ?? null,
      observacao: input.observacao?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select(ANOTACAO_SELECT)
    .single();

  if (error) {
    console.error("[anotacoes-pessoais] atualizar.erro", error.message);
    throw error;
  }

  return mapAnotacao(data as Record<string, unknown>);
}

export async function excluirAnotacaoPessoal(
  client: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await client
    .from("anotacoes_pessoais")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[anotacoes-pessoais] excluir.erro", error.message);
    throw error;
  }
}
