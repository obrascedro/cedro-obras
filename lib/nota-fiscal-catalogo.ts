import {
  CATALOGO_OBRA,
  type EntradaCatalogoObra,
} from "@/lib/nota-fiscal-catalogo-data";
import {
  ETAPA_PADRAO,
  type CategoriaNotaFiscal,
  type EtapaNotaFiscal,
} from "@/lib/nota-fiscal-constants";
import {
  normalizarCategoria,
  normalizarEtapa,
} from "@/lib/nota-fiscal-normalizacao";

export type ResultadoCatalogo = {
  categoria: CategoriaNotaFiscal;
  etapa: EtapaNotaFiscal;
  unidade?: string;
  termoEncontrado: string;
  confianca_categoria: number;
  confianca_etapa: number;
  matchExato: boolean;
};

/** Normaliza texto para busca no catálogo (sem acentos, minúsculas). */
export function normalizarTermoClassificacao(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s./'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chave estável para aprendizado — primeiras palavras significativas da descrição. */
export function gerarChaveClassificacao(descricao: string): string {
  const normalizado = normalizarTermoClassificacao(descricao);
  const palavras = normalizado.split(" ").filter((p) => p.length > 1);
  return palavras.slice(0, 6).join(" ") || normalizado;
}

const INDICE_EXATO = new Map<string, EntradaCatalogoObra>();
const TERMOS_ORDENADOS: Array<{ chave: string; entrada: EntradaCatalogoObra }> =
  [];

for (const entrada of CATALOGO_OBRA) {
  const chave = normalizarTermoClassificacao(entrada.termo);
  if (!INDICE_EXATO.has(chave)) {
    INDICE_EXATO.set(chave, entrada);
  }
  TERMOS_ORDENADOS.push({ chave, entrada });
}

TERMOS_ORDENADOS.sort((a, b) => b.chave.length - a.chave.length);

function montarResultadoCatalogo(
  entrada: EntradaCatalogoObra,
  termoEncontrado: string,
  matchExato: boolean
): ResultadoCatalogo {
  const etapaNormalizada = normalizarEtapa(entrada.etapa);
  const confianca = matchExato ? 1 : 0.98;
  const confEtapa =
    etapaNormalizada === ETAPA_PADRAO
      ? matchExato
        ? 0.85
        : 0.82
      : confianca;

  return {
    categoria: normalizarCategoria(entrada.categoria),
    etapa: etapaNormalizada,
    unidade: entrada.unidade,
    termoEncontrado,
    confianca_categoria: confianca,
    confianca_etapa: confEtapa,
    matchExato,
  };
}

export function buscarNoCatalogoObra(
  descricao: string
): ResultadoCatalogo | null {
  const texto = normalizarTermoClassificacao(descricao);
  if (!texto) return null;

  const exato = INDICE_EXATO.get(texto);
  if (exato) {
    return montarResultadoCatalogo(exato, exato.termo, true);
  }

  for (const { chave, entrada } of TERMOS_ORDENADOS) {
    if (chave.length < 3) continue;
    if (texto.includes(chave)) {
      return montarResultadoCatalogo(entrada, entrada.termo, false);
    }
  }

  return null;
}

export function obterEstatisticasCatalogo() {
  return {
    totalEntradas: CATALOGO_OBRA.length,
    termosUnicos: INDICE_EXATO.size,
  };
}
