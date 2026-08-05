import type { ContextoClassificacaoMotor } from "@/lib/gastos-classificacao-motor";
import {
  classificarGastoObra,
  type ResultadoClassificacaoGasto,
} from "@/lib/gastos-classificacao-motor";
import type { ClassificacaoAprendida } from "@/lib/nota-fiscal-classificacao-aprendida";
import {
  calcularNecessitaRevisao,
  normalizarCategoria,
  normalizarEtapa,
  type FonteClassificacao,
} from "@/lib/nota-fiscal-normalizacao";

export type { FonteClassificacao };
export { normalizarCategoria, normalizarEtapa, calcularNecessitaRevisao };

export type ContextoClassificacao = ContextoClassificacaoMotor & {
  aprendidas?: Map<string, ClassificacaoAprendida>;
};

export type ResultadoClassificacaoItem = ResultadoClassificacaoGasto;

/**
 * @deprecated Prefer classificarGastoObra from gastos-classificacao-motor
 */
export function classificarItemObra(
  descricao: string,
  categoriaIA: unknown,
  etapaIA: unknown,
  confCategoriaIA: unknown,
  confEtapaIA: unknown,
  contexto?: ContextoClassificacao
): ResultadoClassificacaoItem {
  return classificarGastoObra(
    descricao,
    contexto,
    {
      categoria: categoriaIA,
      etapa: etapaIA,
      confianca_categoria: confCategoriaIA,
      confianca_etapa: confEtapaIA,
    }
  );
}

export function enriquecerClassificacaoItem(
  descricao: string,
  categoriaIA: unknown,
  etapaIA: unknown,
  confCategoriaIA: unknown,
  confEtapaIA: unknown,
  contexto?: ContextoClassificacao
) {
  const resultado = classificarItemObra(
    descricao,
    categoriaIA,
    etapaIA,
    confCategoriaIA,
    confEtapaIA,
    contexto
  );

  return {
    categoria: resultado.categoria,
    etapa: resultado.etapa,
    unidade: resultado.unidade,
    confianca_categoria: resultado.confianca_categoria,
    confianca_etapa: resultado.confianca_etapa,
    necessita_revisao: resultado.necessita_revisao,
    fonte: resultado.fonte,
    mensagem_revisao: resultado.mensagem_revisao,
  };
}

export function aplicarClassificacaoEmLeitura<
  T extends {
    descricao: string;
    categoria: string;
    etapa: string;
    confianca_categoria: number;
    confianca_etapa: number;
    necessita_revisao: boolean;
  },
>(
  itens: T[],
  registroBruto: unknown[],
  contexto?: ContextoClassificacao
): T[] {
  return itens.map((item, index) => {
    const bruto = (registroBruto[index] ?? {}) as Record<string, unknown>;
    const classificacao = classificarItemObra(
      item.descricao,
      bruto.categoria ?? bruto.categoria_sugerida,
      bruto.etapa ?? bruto.etapa_sugerida,
      bruto.confianca_categoria,
      bruto.confianca_etapa,
      contexto
    );

    return {
      ...item,
      categoria: classificacao.categoria,
      etapa: classificacao.etapa,
      confianca_categoria: classificacao.confianca_categoria,
      confianca_etapa: classificacao.confianca_etapa,
      necessita_revisao: classificacao.necessita_revisao,
    };
  });
}
