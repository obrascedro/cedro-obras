import type { NotaFiscalItemExtraido } from "@/lib/nota-fiscal-ia";
import type { AlertasLeitura } from "@/lib/nota-fiscal-validacao";
import { DIVERGENCIA_VALOR_TOLERANCIA } from "@/lib/nota-fiscal-constants";

export type ResumoPendenciasNotas = {
  quantidadePendente: number;
  valorTotalPendente: number;
  quantidadeErro: number;
  quantidadeDivergencia: number;
  quantidadeBaixaConfianca: number;
};

type NotaParaResumo = {
  status_processamento: string;
  valor_total: number | null;
  itens_json?: unknown;
  leitura_json?: unknown;
};

function analisarItensJson(itensJson: unknown): NotaFiscalItemExtraido[] {
  if (!Array.isArray(itensJson)) return [];
  return itensJson as NotaFiscalItemExtraido[];
}

export function calcularAlertasNota(
  valorTotal: number,
  itens: NotaFiscalItemExtraido[]
): Pick<AlertasLeitura, "divergenciaValor" | "diferencaValor"> & {
  baixaConfianca: number;
} {
  const somaItens = itens.reduce((s, i) => s + (i.valor_total ?? 0), 0);
  const diferencaValor = Math.abs(somaItens - valorTotal);
  const divergenciaValor =
    valorTotal > 0 && diferencaValor > DIVERGENCIA_VALOR_TOLERANCIA;
  const baixaConfianca = itens.filter(
    (i) => i.necessita_revisao && !i.revisado_pelo_usuario
  ).length;

  return { divergenciaValor, diferencaValor, baixaConfianca };
}

export function calcularResumoPendencias(
  notas: NotaParaResumo[]
): ResumoPendenciasNotas {
  let quantidadePendente = 0;
  let valorTotalPendente = 0;
  let quantidadeErro = 0;
  let quantidadeDivergencia = 0;
  let quantidadeBaixaConfianca = 0;

  for (const nota of notas) {
    const status = nota.status_processamento;

    if (status === "erro") {
      quantidadeErro += 1;
    }

    if (
      status === "pendente_aprovacao" ||
      status === "revisar"
    ) {
      quantidadePendente += 1;
      valorTotalPendente += nota.valor_total ?? 0;

      const itens = analisarItensJson(nota.itens_json);
      const alertas = calcularAlertasNota(nota.valor_total ?? 0, itens);
      if (alertas.divergenciaValor) quantidadeDivergencia += 1;
      if (alertas.baixaConfianca > 0) quantidadeBaixaConfianca += 1;
    }
  }

  return {
    quantidadePendente,
    valorTotalPendente,
    quantidadeErro,
    quantidadeDivergencia,
    quantidadeBaixaConfianca,
  };
}
