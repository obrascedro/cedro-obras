import {
  CATEGORIAS_NOTA_FISCAL,
  CATEGORIA_PADRAO,
  CONFIANCA_MINIMA,
  ETAPA_PADRAO,
  ETAPAS_NOTA_FISCAL,
  type CategoriaNotaFiscal,
  type EtapaNotaFiscal,
} from "@/lib/nota-fiscal-constants";

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function encontrarNaLista<T extends string>(valor: string, lista: readonly T[]): T | null {
  const normalizado = normalizarTexto(valor);
  const exato = lista.find((item) => normalizarTexto(item) === normalizado);
  if (exato) return exato;
  const parcial = lista.find(
    (item) =>
      normalizarTexto(item).includes(normalizado) ||
      normalizado.includes(normalizarTexto(item))
  );
  return parcial ?? null;
}

export function normalizarCategoria(valor: unknown): CategoriaNotaFiscal {
  if (typeof valor !== "string" || !valor.trim()) return CATEGORIA_PADRAO;

  const aliases: Record<string, CategoriaNotaFiscal> = {
    equipamentos: "Equipamento",
    equipamento: "Equipamento",
    fretes: "Frete",
    terceiros: "Serviço terceirizado",
    "servico terceirizado": "Serviço terceirizado",
    "serviço terceirizado": "Serviço terceirizado",
    "mao de obra": "Mão de obra",
    "mão de obra": "Mão de obra",
    imposto: "Impostos e taxas",
    taxa: "Impostos e taxas",
    projeto: "Projeto e documentação",
    documentacao: "Projeto e documentação",
    documentação: "Projeto e documentação",
  };

  const chave = normalizarTexto(valor);
  if (aliases[chave]) return aliases[chave];

  return encontrarNaLista(valor, CATEGORIAS_NOTA_FISCAL) ?? CATEGORIA_PADRAO;
}

export function normalizarEtapa(valor: unknown): EtapaNotaFiscal {
  if (typeof valor !== "string" || !valor.trim()) return ETAPA_PADRAO;

  const aliases: Record<string, EtapaNotaFiscal> = {
    eletrica: "Instalações elétricas",
    elétrica: "Instalações elétricas",
    hidraulica: "Instalações hidráulicas",
    hidráulica: "Instalações hidráulicas",
    estrutura: "Superestrutura",
    acabamentos: "Acabamento",
    "nao classificado": "Não classificado",
    "não classificado": "Não classificado",
  };

  const chave = normalizarTexto(valor);
  if (aliases[chave]) return aliases[chave];

  return encontrarNaLista(valor, ETAPAS_NOTA_FISCAL) ?? ETAPA_PADRAO;
}

export function calcularNecessitaRevisao(
  confiancaCategoria: number,
  confiancaEtapa: number
): boolean {
  return (
    confiancaCategoria < CONFIANCA_MINIMA || confiancaEtapa < CONFIANCA_MINIMA
  );
}

export type FonteClassificacao =
  | "aprendida"
  | "catalogo"
  | "ia"
  | "regra"
  | "padrao";
