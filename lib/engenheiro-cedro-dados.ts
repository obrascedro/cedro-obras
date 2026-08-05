import type { SupabaseClient } from "@supabase/supabase-js";
import type { SnapshotEngenheiroCedro } from "@/lib/engenheiro-cedro-types";

function extrairNomeRelacao(
  relacao: { nome: string } | { nome: string }[] | null | undefined
): string {
  if (!relacao) return "—";
  if (Array.isArray(relacao)) return relacao[0]?.nome ?? "—";
  return relacao.nome;
}

export async function carregarSnapshotEngenheiroCedro(
  client: SupabaseClient
): Promise<SnapshotEngenheiroCedro> {
  const [
    { data: obrasRaw },
    { data: gastosRaw },
    { data: notasRaw },
    { data: aprendidasRaw },
  ] = await Promise.all([
    client
      .from("obras")
      .select(
        "id, nome, status, orcamento_previsto, valor_recebido, gasto_realizado, lucro_estimado, data_inicio, data_previsao_termino, clientes(nome)"
      )
      .order("nome"),
    client
      .from("gastos_obra")
      .select(
        "id, obra_id, etapa, categoria, descricao, fornecedor, quantidade, valor_unitario, valor_total, data_gasto, obras(nome)"
      )
      .order("data_gasto", { ascending: false }),
    client
      .from("notas_fiscais")
      .select(
        "id, obra_id, fornecedor, data_nota, valor_total, status_processamento, obras(nome)"
      )
      .order("criado_em", { ascending: false }),
    client
      .from("classificacoes_aprendidas")
      .select("termo_chave, categoria, etapa, uso_count")
      .order("uso_count", { ascending: false })
      .limit(50),
  ]);

  const obras = (obrasRaw ?? []).map((obra) => ({
    id: obra.id,
    nome: obra.nome,
    status: obra.status,
    cliente_nome: extrairNomeRelacao(
      obra.clientes as { nome: string } | { nome: string }[] | null
    ),
    orcamento_previsto: obra.orcamento_previsto ?? 0,
    valor_recebido: obra.valor_recebido ?? 0,
    gasto_realizado: obra.gasto_realizado ?? 0,
    lucro_estimado:
      obra.lucro_estimado ??
      (obra.valor_recebido ?? 0) - (obra.gasto_realizado ?? 0),
    data_inicio: obra.data_inicio,
    data_previsao_termino: obra.data_previsao_termino,
  }));

  const gastos = (gastosRaw ?? []).map((gasto) => ({
    id: gasto.id,
    obra_id: gasto.obra_id,
    obra_nome: extrairNomeRelacao(
      gasto.obras as { nome: string } | { nome: string }[] | null
    ),
    etapa: gasto.etapa ?? "Não classificado",
    categoria: gasto.categoria ?? "Outros",
    descricao: gasto.descricao ?? "",
    fornecedor: gasto.fornecedor,
    quantidade: gasto.quantidade ?? 0,
    valor_unitario: gasto.valor_unitario ?? 0,
    valor_total: gasto.valor_total ?? 0,
    data_gasto: gasto.data_gasto,
  }));

  const notas = (notasRaw ?? []).map((nota) => ({
    id: nota.id,
    obra_id: nota.obra_id,
    obra_nome: extrairNomeRelacao(
      nota.obras as { nome: string } | { nome: string }[] | null
    ),
    fornecedor: nota.fornecedor,
    data_nota: nota.data_nota,
    valor_total: nota.valor_total ?? 0,
    status_processamento: nota.status_processamento ?? "aguardando",
  }));

  const classificacoesAprendidas = (aprendidasRaw ?? []).map((item) => ({
    termo_chave: item.termo_chave,
    categoria: item.categoria,
    etapa: item.etapa,
    uso_count: item.uso_count ?? 1,
  }));

  const gastoGeral = obras.reduce((s, o) => s + o.gasto_realizado, 0);
  const recebidoGeral = obras.reduce((s, o) => s + o.valor_recebido, 0);
  const orcamentoGeral = obras.reduce((s, o) => s + o.orcamento_previsto, 0);

  return {
    obras,
    gastos,
    notas,
    classificacoesAprendidas,
    totais: {
      gastoGeral,
      recebidoGeral,
      lucroGeral: recebidoGeral - gastoGeral,
      orcamentoGeral,
    },
  };
}
