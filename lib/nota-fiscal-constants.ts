export const CATEGORIAS_NOTA_FISCAL = [
  "Material",
  "Mão de obra",
  "Equipamento",
  "Frete",
  "Serviço terceirizado",
  "Projeto e documentação",
  "Impostos e taxas",
  "Outros",
] as const;

export const ETAPAS_NOTA_FISCAL = [
  "Serviços preliminares",
  "Fundação",
  "Infraestrutura",
  "Superestrutura",
  "Alvenaria",
  "Cobertura",
  "Instalações elétricas",
  "Instalações hidráulicas",
  "Impermeabilização",
  "Revestimentos",
  "Pisos",
  "Esquadrias",
  "Pintura",
  "Acabamento",
  "Área externa",
  "Não classificado",
] as const;

export type CategoriaNotaFiscal = (typeof CATEGORIAS_NOTA_FISCAL)[number];
export type EtapaNotaFiscal = (typeof ETAPAS_NOTA_FISCAL)[number];

export const CONFIANCA_MINIMA = 0.8;
export const MENSAGEM_REVISAO_CLASSIFICACAO = "Confirme esta classificação.";
export const DIVERGENCIA_VALOR_TOLERANCIA = 0.05;

export const CATEGORIA_PADRAO: CategoriaNotaFiscal = "Outros";
export const ETAPA_PADRAO: EtapaNotaFiscal = "Não classificado";
