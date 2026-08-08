import type { CategoriaGasto, EtapaGasto } from "@/lib/gastos-opcoes";

export {
  CATEGORIAS_GASTO as CATEGORIAS_NOTA_FISCAL,
  ETAPAS_GASTO as ETAPAS_NOTA_FISCAL,
  type CategoriaGasto as CategoriaNotaFiscal,
  type EtapaGasto as EtapaNotaFiscal,
} from "@/lib/gastos-opcoes";

export const CATEGORIA_PADRAO: CategoriaGasto = "Outros";
export const ETAPA_PADRAO: EtapaGasto = "Geral";

export const CONFIANCA_MINIMA = 0.8;
export const MENSAGEM_REVISAO_CLASSIFICACAO = "Confirme esta classificação.";
export const DIVERGENCIA_VALOR_TOLERANCIA = 0.05;
