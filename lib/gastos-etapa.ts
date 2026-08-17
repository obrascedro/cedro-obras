export type GastoEtapaItem = {
  etapa: string;
  total: number;
  percentual: number;
};

const ETAPAS_NAO_CLASSIFICADAS = new Set([
  "",
  "nao classificado",
  "não classificado",
  "sem etapa",
  "nao informado",
  "não informado",
]);

export function normalizeEtapaKey(etapa: string): string {
  const trimmed = etapa.trim();

  if (!trimmed) {
    return "__nao_classificado__";
  }

  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (ETAPAS_NAO_CLASSIFICADAS.has(normalized)) {
    return "__nao_classificado__";
  }

  return normalized;
}

/** Compara duas etapas ignorando acentos, caixa e variantes de "não classificado". */
export function etapasCorrespondem(etapaA: string, etapaB: string): boolean {
  return normalizeEtapaKey(etapaA) === normalizeEtapaKey(etapaB);
}

export function urlGastosEtapaObra(obraId: string, etapa: string): string {
  return `/obras/${obraId}/gastos?etapa=${encodeURIComponent(etapa)}`;
}

function escolherNomeEtapa(originals: string[]): string {
  if (!originals.length) {
    return "Não classificado";
  }

  const unicos = [...new Set(originals.map((nome) => nome.trim()).filter(Boolean))];

  unicos.sort((a, b) => {
    const aCapitalizada = /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(a) ? 1 : 0;
    const bCapitalizada = /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(b) ? 1 : 0;

    if (bCapitalizada !== aCapitalizada) {
      return bCapitalizada - aCapitalizada;
    }

    return b.length - a.length;
  });

  return unicos[0];
}

export function agruparGastosPorEtapaDetalhado(
  gastos: { etapa: string; valor_total: number | null }[]
): GastoEtapaItem[] {
  const grupos = new Map<string, { originals: string[]; total: number }>();

  for (const gasto of gastos) {
    const original = String(gasto.etapa ?? "").trim();
    const key = normalizeEtapaKey(original);
    const atual = grupos.get(key) ?? { originals: [], total: 0 };

    if (original) {
      atual.originals.push(original);
    }

    atual.total += gasto.valor_total ?? 0;
    grupos.set(key, atual);
  }

  const totalGeral = Array.from(grupos.values()).reduce(
    (sum, grupo) => sum + grupo.total,
    0
  );

  return Array.from(grupos.entries())
    .map(([key, grupo]) => ({
      etapa:
        key === "__nao_classificado__"
          ? "Não classificado"
          : escolherNomeEtapa(grupo.originals),
      total: grupo.total,
      percentual:
        totalGeral > 0 ? Math.round((grupo.total / totalGeral) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function resumirGastosPorEtapa(itens: GastoEtapaItem[]) {
  const totalDetalhado = itens.reduce((sum, item) => sum + item.total, 0);
  const maiorEtapa = itens[0] ?? null;

  return {
    totalDetalhado,
    maiorEtapa,
    percentualMaiorEtapa: maiorEtapa?.percentual ?? 0,
  };
}
