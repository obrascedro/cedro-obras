import type { SupabaseClient } from "@supabase/supabase-js";
import { etapasCorrespondem } from "@/lib/gastos-etapa";
import {
  listarGastosObraPorEtapa,
  type GastoObraRow,
} from "@/lib/gastos-obra";
import {
  formatDescricaoComUnidade,
  type NotaFiscalItemExtraido,
} from "@/lib/nota-fiscal-ia";
import { formatOrigemNota, type NotaFiscal } from "@/lib/notas-fiscais";
import { isAprovada } from "@/lib/notas-fiscais-status";

const NOTA_FISCAL_SELECT =
  "id, obra_id, arquivo_path, arquivo_nome, arquivo_tipo, arquivo_tamanho, fornecedor, data_nota, valor_total, observacoes, origem, status_processamento, criado_em, enviado_por_nome, aprovado_por_nome, aprovado_em, rejeitado_por_nome, motivo_rejeicao, mensagem_correcao, leitura_json, itens_json";

export type LinhaFinanceiraEtapa = {
  id: string;
  tipo: "gasto" | "nota_fiscal";
  data: string | null;
  descricao: string;
  fornecedor: string | null;
  categoria: string;
  etapa: string;
  valor: number;
  statusNota?: string;
  origem: string;
  nota?: NotaFiscal;
  gastoId?: string;
};

function parseItensNota(nota: NotaFiscal): NotaFiscalItemExtraido[] {
  if (!Array.isArray(nota.itens_json)) return [];
  return nota.itens_json as NotaFiscalItemExtraido[];
}

function formatOrigemGasto(origem: string | null): string {
  switch (origem) {
    case "nota_fiscal":
      return "Nota fiscal";
    case "manual":
      return "Gasto manual";
    case "migracao":
      return "Migração";
    case "importacao":
      return "Importação";
    default:
      if (!origem?.trim()) return "Gasto manual";
      return origem.charAt(0).toUpperCase() + origem.slice(1);
  }
}

function encontrarNotaParaGasto(
  gasto: GastoObraRow,
  notas: NotaFiscal[]
): NotaFiscal | undefined {
  if (gasto.origem !== "nota_fiscal") return undefined;

  for (const nota of notas.filter((n) => isAprovada(n.status_processamento))) {
    const itens = parseItensNota(nota);
    const match = itens.some(
      (item) =>
        etapasCorrespondem(item.etapa, gasto.etapa) &&
        Math.abs((item.valor_total ?? 0) - (gasto.valor_total ?? 0)) < 0.02 &&
        (item.descricao === gasto.descricao ||
          formatDescricaoComUnidade(item) === gasto.descricao)
    );
    if (match) return nota;
  }

  return undefined;
}

function gastoParaLinha(
  gasto: GastoObraRow,
  notasObra: NotaFiscal[]
): LinhaFinanceiraEtapa {
  const nota = encontrarNotaParaGasto(gasto, notasObra);
  const origemNota = gasto.origem === "nota_fiscal";

  return {
    id: `gasto-${gasto.id}`,
    tipo: origemNota ? "nota_fiscal" : "gasto",
    data: gasto.data_gasto,
    descricao: gasto.descricao,
    fornecedor: gasto.fornecedor,
    categoria: gasto.categoria,
    etapa: gasto.etapa,
    valor: gasto.valor_total ?? 0,
    origem: formatOrigemGasto(gasto.origem),
    nota,
    gastoId: gasto.id,
  };
}

function notaPendenteParaLinha(
  nota: NotaFiscal,
  etapaFiltro: string
): LinhaFinanceiraEtapa | null {
  const itens = parseItensNota(nota).filter((item) =>
    etapasCorrespondem(item.etapa, etapaFiltro)
  );

  if (!itens.length) return null;

  const valor = itens.reduce((sum, item) => sum + (item.valor_total ?? 0), 0);
  const primeiraDescricao = itens[0]?.descricao || nota.arquivo_nome;
  const categoria =
    itens.length === 1 ? itens[0].categoria : `${itens.length} itens`;

  return {
    id: `nota-${nota.id}`,
    tipo: "nota_fiscal",
    data: nota.data_nota ?? nota.criado_em?.slice(0, 10) ?? null,
    descricao:
      itens.length > 1
        ? `${primeiraDescricao} (+${itens.length - 1} itens)`
        : primeiraDescricao,
    fornecedor: nota.fornecedor,
    categoria,
    etapa: etapaFiltro,
    valor,
    statusNota: nota.status_processamento,
    origem: formatOrigemNota(nota.origem),
    nota,
  };
}

function ordenarPorDataDesc(linhas: LinhaFinanceiraEtapa[]): LinhaFinanceiraEtapa[] {
  return [...linhas].sort((a, b) => {
    const dataA = a.data ?? "";
    const dataB = b.data ?? "";
    return dataB.localeCompare(dataA);
  });
}

export async function consultarGastosPorEtapaObra(
  client: SupabaseClient,
  obraId: string,
  etapa: string
): Promise<{ linhas: LinhaFinanceiraEtapa[]; total: number }> {
  const [gastos, notasResult] = await Promise.all([
    listarGastosObraPorEtapa(client, obraId, etapa),
    client
      .from("notas_fiscais")
      .select(NOTA_FISCAL_SELECT)
      .eq("obra_id", obraId)
      .order("criado_em", { ascending: false }),
  ]);

  if (notasResult.error) {
    console.error(
      "[gastos-por-etapa] notas.erro",
      notasResult.error.message
    );
    throw notasResult.error;
  }

  const notas = (notasResult.data ?? []) as NotaFiscal[];

  const linhasGasto = gastos.map((gasto) => gastoParaLinha(gasto, notas));
  const linhasNota = notas
    .filter((nota) => !isAprovada(nota.status_processamento))
    .map((nota) => notaPendenteParaLinha(nota, etapa))
    .filter((linha): linha is LinhaFinanceiraEtapa => linha !== null);

  const linhas = ordenarPorDataDesc([...linhasGasto, ...linhasNota]);
  const total = linhas.reduce((sum, linha) => sum + linha.valor, 0);

  return { linhas, total };
}
