import {
  CATEGORIA_PADRAO,
  CONFIANCA_MINIMA,
  ETAPA_PADRAO,
  MENSAGEM_REVISAO_CLASSIFICACAO,
  type CategoriaNotaFiscal,
  type EtapaNotaFiscal,
} from "@/lib/nota-fiscal-constants";
import {
  buscarClassificacaoAprendida,
  type ClassificacaoAprendida,
} from "@/lib/nota-fiscal-classificacao-aprendida";
import { buscarNoCatalogoObra } from "@/lib/nota-fiscal-catalogo";
import {
  normalizarCategoria,
  normalizarEtapa,
  calcularNecessitaRevisao,
  type FonteClassificacao,
} from "@/lib/nota-fiscal-normalizacao";

export type { FonteClassificacao };

export type ContextoClassificacaoMotor = {
  aprendidas?: Map<string, ClassificacaoAprendida>;
};

export type SugestaoClassificacaoIA = {
  categoria?: unknown;
  etapa?: unknown;
  confianca_categoria?: unknown;
  confianca_etapa?: unknown;
};

export type ResultadoClassificacaoGasto = {
  categoria: CategoriaNotaFiscal;
  etapa: EtapaNotaFiscal;
  unidade?: string;
  confianca_categoria: number;
  confianca_etapa: number;
  necessita_revisao: boolean;
  fonte: FonteClassificacao;
  mensagem_revisao?: string;
};

type RegraClassificacao = {
  termos: string[];
  categoria: CategoriaNotaFiscal;
  etapa: EtapaNotaFiscal;
  confianca: number;
};

const REGRAS_FALLBACK: RegraClassificacao[] = [
  {
    termos: ["cimento", "areia", "brita", "concreto", "sapata", "fundacao", "fundação"],
    categoria: "Material",
    etapa: "Fundação",
    confianca: 0.82,
  },
  {
    termos: ["ferro", "pilar", "viga", "laje", "escoramento", "armadura", "vergalhao", "vergalhão", "aco ca50", "aço ca50"],
    categoria: "Material",
    etapa: "Superestrutura",
    confianca: 0.82,
  },
  {
    termos: ["tijolo", "bloco", "argamassa de assentamento"],
    categoria: "Material",
    etapa: "Alvenaria",
    confianca: 0.82,
  },
  {
    termos: ["telha", "calha", "cumeeira"],
    categoria: "Material",
    etapa: "Cobertura",
    confianca: 0.82,
  },
  {
    termos: ["fio", "cabo", "disjuntor", "quadro eletrico", "quadro elétrico", "tomada"],
    categoria: "Material",
    etapa: "Instalações elétricas",
    confianca: 0.82,
  },
  {
    termos: ["tubo", "conexao", "conexão", "caixa dagua", "caixa d'água", "registro", "torneira"],
    categoria: "Material",
    etapa: "Instalações hidráulicas",
    confianca: 0.82,
  },
  {
    termos: ["manta asfaltica", "manta asfáltica", "impermeabilizante", "sika"],
    categoria: "Material",
    etapa: "Impermeabilização",
    confianca: 0.82,
  },
  {
    termos: ["tinta", "massa corrida", "selador"],
    categoria: "Material",
    etapa: "Pintura",
    confianca: 0.82,
  },
  {
    termos: ["frete", "entrega", "transporte", "carreto"],
    categoria: "Frete",
    etapa: ETAPA_PADRAO,
    confianca: 0.85,
  },
  {
    termos: ["betoneira", "escavadeira", "bobcat", "aluguel de maquina", "aluguel de máquina"],
    categoria: "Equipamento",
    etapa: ETAPA_PADRAO,
    confianca: 0.82,
  },
  {
    termos: ["pedreiro", "servente", "diaria", "diária", "quinzena", "mao de obra", "mão de obra"],
    categoria: "Mão de obra",
    etapa: ETAPA_PADRAO,
    confianca: 0.82,
  },
];

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classificarPorRegras(descricao: string): ResultadoClassificacaoGasto | null {
  const texto = normalizarTexto(descricao);

  for (const regra of REGRAS_FALLBACK) {
    const encontrou = regra.termos.some((termo) =>
      texto.includes(normalizarTexto(termo))
    );
    if (encontrou) {
      const confEtapa = regra.etapa === ETAPA_PADRAO ? 0.75 : regra.confianca;
      const confianca = Math.min(regra.confianca, confEtapa);
      return montarResultado({
        categoria: regra.categoria,
        etapa: regra.etapa,
        confianca_categoria: regra.confianca,
        confianca_etapa: confEtapa,
        fonte: "regra",
      });
    }
  }

  return null;
}

function classificarPorIA(
  sugestao: SugestaoClassificacaoIA
): ResultadoClassificacaoGasto {
  const categoria = normalizarCategoria(sugestao.categoria);
  const etapa = normalizarEtapa(sugestao.etapa);
  const confianca_categoria =
    typeof sugestao.confianca_categoria === "number" &&
    Number.isFinite(sugestao.confianca_categoria)
      ? Math.min(1, Math.max(0, sugestao.confianca_categoria))
      : 0.55;
  const confianca_etapa =
    typeof sugestao.confianca_etapa === "number" &&
    Number.isFinite(sugestao.confianca_etapa)
      ? Math.min(1, Math.max(0, sugestao.confianca_etapa))
      : 0.55;

  const categoriaValida = categoria !== CATEGORIA_PADRAO;
  const etapaValida = etapa !== ETAPA_PADRAO;

  return montarResultado({
    categoria: categoriaValida ? categoria : CATEGORIA_PADRAO,
    etapa: etapaValida ? etapa : ETAPA_PADRAO,
    confianca_categoria: categoriaValida ? confianca_categoria : 0.4,
    confianca_etapa: etapaValida ? confianca_etapa : 0.4,
    fonte: "ia",
  });
}

function montarResultado(params: {
  categoria: CategoriaNotaFiscal;
  etapa: EtapaNotaFiscal;
  confianca_categoria: number;
  confianca_etapa: number;
  fonte: FonteClassificacao;
  unidade?: string;
}): ResultadoClassificacaoGasto {
  const necessita_revisao = calcularNecessitaRevisao(
    params.confianca_categoria,
    params.confianca_etapa
  );

  return {
    categoria: params.categoria,
    etapa: params.etapa,
    unidade: params.unidade,
    confianca_categoria: params.confianca_categoria,
    confianca_etapa: params.confianca_etapa,
    necessita_revisao,
    fonte: params.fonte,
    mensagem_revisao: necessita_revisao ? MENSAGEM_REVISAO_CLASSIFICACAO : undefined,
  };
}

/**
 * Motor inteligente de classificação de gastos da construção civil.
 *
 * Ordem de prioridade:
 * 1. Base interna (catálogo)
 * 2. Correções aprendidas do usuário
 * 3. OpenAI (somente quando sugestaoIA é fornecida)
 * 4. Regras genéricas
 * 5. Padrão (Outros / Não classificado)
 */
export function classificarGastoObra(
  descricao: string,
  contexto?: ContextoClassificacaoMotor,
  sugestaoIA?: SugestaoClassificacaoIA
): ResultadoClassificacaoGasto {
  const catalogo = buscarNoCatalogoObra(descricao);
  if (catalogo) {
    return montarResultado({
      categoria: catalogo.categoria,
      etapa: catalogo.etapa,
      unidade: catalogo.unidade,
      confianca_categoria: catalogo.confianca_categoria,
      confianca_etapa: catalogo.confianca_etapa,
      fonte: "catalogo",
    });
  }

  if (contexto?.aprendidas) {
    const aprendida = buscarClassificacaoAprendida(descricao, contexto.aprendidas);
    if (aprendida) {
      return montarResultado({
        categoria: aprendida.categoria,
        etapa: aprendida.etapa,
        confianca_categoria: 0.95,
        confianca_etapa: 0.95,
        fonte: "aprendida",
      });
    }
  }

  if (sugestaoIA) {
    const ia = classificarPorIA(sugestaoIA);
    if (ia.fonte === "ia" && !ia.necessita_revisao) {
      return ia;
    }

    const regra = classificarPorRegras(descricao);
    if (regra && regra.confianca_categoria >= ia.confianca_categoria) {
      return regra;
    }

    if (ia.categoria !== CATEGORIA_PADRAO || ia.etapa !== ETAPA_PADRAO) {
      return ia;
    }
  } else {
    const regra = classificarPorRegras(descricao);
    if (regra) return regra;
  }

  return montarResultado({
    categoria: CATEGORIA_PADRAO,
    etapa: ETAPA_PADRAO,
    confianca_categoria: 0.4,
    confianca_etapa: 0.4,
    fonte: "padrao",
  });
}

/** Indica se o item precisa de inferência via OpenAI (não encontrado no catálogo nem aprendizado). */
export function precisaClassificacaoIA(
  descricao: string,
  contexto?: ContextoClassificacaoMotor
): boolean {
  if (buscarNoCatalogoObra(descricao)) return false;

  if (contexto?.aprendidas) {
    if (buscarClassificacaoAprendida(descricao, contexto.aprendidas)) {
      return false;
    }
  }

  return true;
}

export function calcularConfiancaMedia(resultado: ResultadoClassificacaoGasto): number {
  return (resultado.confianca_categoria + resultado.confianca_etapa) / 2;
}

export function formatarConfiancaPercentual(confianca: number): string {
  return `${Math.round(confianca * 100)}%`;
}

export { CONFIANCA_MINIMA };
