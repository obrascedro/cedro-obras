import type { GastoObraRow } from "@/lib/gastos-obra";

export const MESES_GASTO_OBRA = [
  { value: "", label: "Todos os meses" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
] as const;

export type FiltrosListagemGastosObra = {
  /** 1–12 ou null = todos os meses (ignora ano). */
  mes: number | null;
  ano: number;
  busca: string;
};

export function normalizarTextoBuscaGasto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Partes de calendário a partir de data_gasto (YYYY-MM-DD ou ISO). */
export function extrairAnoMesDataGasto(
  dataGasto: string | null | undefined
): { ano: number; mes: number } | null {
  if (!dataGasto?.trim()) return null;

  const parteData = dataGasto.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parteData);
  if (!match) return null;

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
    return null;
  }

  return { ano, mes };
}

export function gastoCorrespondeBuscaObra(
  gasto: GastoObraRow,
  busca: string
): boolean {
  const termo = busca.trim();
  if (!termo) return true;

  const needle = normalizarTextoBuscaGasto(termo);
  const haystack = normalizarTextoBuscaGasto(
    [gasto.descricao, gasto.categoria, gasto.fornecedor ?? ""].join(" ")
  );

  return haystack.includes(needle);
}

export function filtrarGastosObraPorMesAno(
  gastos: GastoObraRow[],
  mes: number | null,
  ano: number
): GastoObraRow[] {
  if (mes == null) return gastos;

  return gastos.filter((gasto) => {
    const partes = extrairAnoMesDataGasto(gasto.data_gasto);
    if (!partes) return false;
    return partes.ano === ano && partes.mes === mes;
  });
}

export function filtrarGastosObraPorBusca(
  gastos: GastoObraRow[],
  busca: string
): GastoObraRow[] {
  if (!busca.trim()) return gastos;
  return gastos.filter((gasto) => gastoCorrespondeBuscaObra(gasto, busca));
}

/** Ordem decrescente por data de lançamento; desempate estável por id. */
export function ordenarGastosObraPorDataDesc(
  gastos: GastoObraRow[]
): GastoObraRow[] {
  return [...gastos].sort((a, b) => {
    const dataA = a.data_gasto ?? "";
    const dataB = b.data_gasto ?? "";
    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }
    return b.id.localeCompare(a.id);
  });
}

export function aplicarFiltrosListagemGastosObra(
  gastos: GastoObraRow[],
  filtros: FiltrosListagemGastosObra
): GastoObraRow[] {
  let resultado = filtrarGastosObraPorMesAno(gastos, filtros.mes, filtros.ano);
  resultado = filtrarGastosObraPorBusca(resultado, filtros.busca);
  return ordenarGastosObraPorDataDesc(resultado);
}

export function somarValorTotalGastos(gastos: GastoObraRow[]): number {
  return gastos.reduce((sum, g) => sum + (g.valor_total ?? 0), 0);
}

export function anosDisponiveisGastosObra(
  gastos: GastoObraRow[],
  anoFallback = new Date().getFullYear()
): number[] {
  const anos = new Set<number>();

  for (const gasto of gastos) {
    const partes = extrairAnoMesDataGasto(gasto.data_gasto);
    if (partes) anos.add(partes.ano);
  }

  if (anos.size === 0) {
    anos.add(anoFallback);
  }

  return [...anos].sort((a, b) => b - a);
}

export function filtrosListagemGastosObraAtivos(
  filtros: FiltrosListagemGastosObra
): boolean {
  return filtros.mes != null || filtros.busca.trim().length > 0;
}
