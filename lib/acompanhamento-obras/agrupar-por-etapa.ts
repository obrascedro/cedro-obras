import { ETAPAS_OBRA } from "@/lib/acompanhamento-obras/etapas";
import type { AcompanhamentoResumo } from "@/lib/acompanhamento-obras/types";

export type GrupoEtapaAcompanhamento = {
  etapa: string;
  etapaCodigo: string;
  itens: AcompanhamentoResumo[];
};

function indiceOrdemEtapa(etapaCodigo: string): number {
  const idx = (ETAPAS_OBRA as readonly string[]).indexOf(etapaCodigo);
  return idx >= 0 ? idx : ETAPAS_OBRA.length;
}

/** Agrupa por etapa escolhida pelo funcionário; cronológico (mais antigo primeiro) dentro de cada grupo. */
export function agruparAcompanhamentosPorEtapa(
  itens: AcompanhamentoResumo[]
): GrupoEtapaAcompanhamento[] {
  const map = new Map<string, GrupoEtapaAcompanhamento>();

  for (const item of itens) {
    const chave = item.etapa;
    const existente = map.get(chave);
    if (existente) {
      existente.itens.push(item);
    } else {
      map.set(chave, {
        etapa: item.etapa,
        etapaCodigo: item.etapa_codigo,
        itens: [item],
      });
    }
  }

  const grupos = Array.from(map.values());

  for (const grupo of grupos) {
    grupo.itens.sort(
      (a, b) =>
        new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    );
  }

  grupos.sort((a, b) => {
    const ordem = indiceOrdemEtapa(a.etapaCodigo) - indiceOrdemEtapa(b.etapaCodigo);
    if (ordem !== 0) return ordem;
    return a.etapa.localeCompare(b.etapa, "pt-BR");
  });

  return grupos;
}
