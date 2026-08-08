/**
 * Listas canônicas de etapa e categoria de gasto.
 * Usadas em: cadastro/edição de gastos, notas fiscais, portal e relatórios.
 */
export const ETAPAS_GASTO = [
  "Planejamento",
  "Limpeza do terreno",
  "Locação da obra",
  "Fundação",
  "Infraestrutura",
  "Estrutura",
  "Alvenaria",
  "Cobertura",
  "Instalação elétrica",
  "Instalação hidráulica",
  "Revestimento",
  "Esquadrias",
  "Pintura",
  "Acabamento",
  "Área externa",
  "Paisagismo",
  "Entrega da obra",
  "Administrativo",
  "Geral",
] as const;

export const CATEGORIAS_GASTO = [
  "Material",
  "Mão de obra",
  "Equipamentos",
  "Ferramentas",
  "Locação",
  "Transporte",
  "Combustível",
  "Frete",
  "Projeto",
  "Documentação",
  "Taxas",
  "Limpeza",
  "Alimentação",
  "EPIs",
  "Terceirizados",
  "Administrativo",
  "Histórico/Migração",
  "Outros",
] as const;

export type EtapaGasto = (typeof ETAPAS_GASTO)[number];
export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export function isEtapaGasto(valor: string): valor is EtapaGasto {
  return (ETAPAS_GASTO as readonly string[]).includes(valor);
}

export function isCategoriaGasto(valor: string): valor is CategoriaGasto {
  return (CATEGORIAS_GASTO as readonly string[]).includes(valor);
}
