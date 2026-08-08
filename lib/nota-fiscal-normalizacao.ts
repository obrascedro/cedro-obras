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

function encontrarNaLista<T extends string>(
  valor: string,
  lista: readonly T[]
): T | null {
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
    equipamentos: "Equipamentos",
    equipamento: "Equipamentos",
    fretes: "Frete",
    frete: "Frete",
    terceiros: "Terceirizados",
    terceirizado: "Terceirizados",
    "servico terceirizado": "Terceirizados",
    "serviço terceirizado": "Terceirizados",
    "mao de obra": "Mão de obra",
    "mão de obra": "Mão de obra",
    imposto: "Taxas",
    impostos: "Taxas",
    taxa: "Taxas",
    "impostos e taxas": "Taxas",
    projeto: "Projeto",
    documentacao: "Documentação",
    documentação: "Documentação",
    "projeto e documentacao": "Projeto",
    "projeto e documentação": "Projeto",
    transporte: "Transporte",
    locacao: "Locação",
    locação: "Locação",
    combustivel: "Combustível",
    combustível: "Combustível",
    administrativo: "Administrativo",
    migracao: "Histórico/Migração",
    migração: "Histórico/Migração",
    "historico/migracao": "Histórico/Migração",
    "histórico/migração": "Histórico/Migração",
  };

  const chave = normalizarTexto(valor);
  if (aliases[chave]) return aliases[chave];

  return encontrarNaLista(valor, CATEGORIAS_NOTA_FISCAL) ?? CATEGORIA_PADRAO;
}

export function normalizarEtapa(valor: unknown): EtapaNotaFiscal {
  if (typeof valor !== "string" || !valor.trim()) return ETAPA_PADRAO;

  const aliases: Record<string, EtapaNotaFiscal> = {
    eletrica: "Instalação elétrica",
    elétrica: "Instalação elétrica",
    "instalacoes eletricas": "Instalação elétrica",
    "instalações elétricas": "Instalação elétrica",
    hidraulica: "Instalação hidráulica",
    hidráulica: "Instalação hidráulica",
    "instalacoes hidraulicas": "Instalação hidráulica",
    "instalações hidráulicas": "Instalação hidráulica",
    estrutura: "Estrutura",
    superestrutura: "Estrutura",
    acabamentos: "Acabamento",
    revestimentos: "Revestimento",
    pisos: "Revestimento",
    impermeabilizacao: "Revestimento",
    impermeabilização: "Revestimento",
    "servicos preliminares": "Planejamento",
    "serviços preliminares": "Planejamento",
    "nao classificado": ETAPA_PADRAO,
    "não classificado": ETAPA_PADRAO,
    administrativo: "Administrativo",
    geral: "Geral",
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
  | "padrao"
  | "funcionario";
