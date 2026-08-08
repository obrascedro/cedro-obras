import type { NotaFiscalLeitura } from "@/lib/nota-fiscal-ia";
import {
  normalizarCategoria,
  normalizarEtapa,
} from "@/lib/nota-fiscal-normalizacao";
import type { CategoriaGasto, EtapaGasto } from "@/lib/gastos-opcoes";

export type ClassificacaoFuncionarioNota = {
  etapa: EtapaGasto;
  categoria: CategoriaGasto;
};

export function parseClassificacaoFuncionarioNota(
  etapaRaw: string,
  categoriaRaw: string
): ClassificacaoFuncionarioNota | null {
  const etapa = normalizarEtapa(etapaRaw.trim());
  const categoria = normalizarCategoria(categoriaRaw.trim());

  if (!etapaRaw.trim() || !categoriaRaw.trim()) {
    return null;
  }

  return { etapa, categoria };
}

/** Aplica a classificação informada pelo funcionário a todos os itens da nota. */
export function aplicarClassificacaoFuncionarioNaLeitura(
  leitura: NotaFiscalLeitura,
  classificacao: ClassificacaoFuncionarioNota
): NotaFiscalLeitura {
  return {
    ...leitura,
    itens: leitura.itens.map((item) => ({
      ...item,
      etapa: classificacao.etapa,
      categoria: classificacao.categoria,
      confianca_categoria: 1,
      confianca_etapa: 1,
      necessita_revisao: false,
      revisado_pelo_usuario: true,
      fonte_classificacao: "funcionario",
    })),
  };
}
