import type { GastoObraRow } from "@/lib/gastos-obra";

/** Categoria canônica — ver CATEGORIAS_GASTO em lib/gastos-opcoes.ts */
export const CATEGORIA_MAO_DE_OBRA = "Mão de obra";

export const TIPO_CONSULTA_MAO_DE_OBRA = "mao-de-obra";

function normalizarChaveCategoria(valor: string): string {
  return valor
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Identifica lançamentos de mão de obra pelo campo categoria. */
export function isCategoriaMaoDeObra(
  categoria: string | null | undefined
): boolean {
  if (!categoria?.trim()) return false;

  return (
    normalizarChaveCategoria(categoria) ===
    normalizarChaveCategoria(CATEGORIA_MAO_DE_OBRA)
  );
}

export function filtrarGastosMaoDeObra(gastos: GastoObraRow[]): GastoObraRow[] {
  return gastos.filter((gasto) => isCategoriaMaoDeObra(gasto.categoria));
}

export function somarGastosMaoDeObra(gastos: GastoObraRow[]): number {
  return filtrarGastosMaoDeObra(gastos).reduce(
    (sum, gasto) => sum + (gasto.valor_total ?? 0),
    0
  );
}

export function urlGastosMaoDeObraObra(obraId: string): string {
  return `/obras/${obraId}/gastos?tipo=${TIPO_CONSULTA_MAO_DE_OBRA}`;
}
