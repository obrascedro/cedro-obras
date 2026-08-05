import {
  DIVERGENCIA_VALOR_TOLERANCIA,
  MENSAGEM_REVISAO_CLASSIFICACAO,
} from "@/lib/nota-fiscal-constants";
import type { NotaFiscalLeitura } from "@/lib/nota-fiscal-ia";

export type AlertasLeitura = {
  divergenciaValor: boolean;
  diferencaValor: number;
  somaItens: number;
  valorNota: number;
  mensagens: string[];
};

export function validarLeituraNotaFiscal(
  leitura: NotaFiscalLeitura
): AlertasLeitura {
  const mensagens: string[] = [];
  const somaItens = leitura.itens.reduce(
    (sum, item) => sum + item.valor_total,
    0
  );
  const valorNota = leitura.valor_total;
  const diferencaValor = Math.abs(somaItens - valorNota);
  const divergenciaValor =
    valorNota > 0 && diferencaValor > DIVERGENCIA_VALOR_TOLERANCIA;

  if (!leitura.fornecedor.trim()) {
    mensagens.push("Fornecedor não identificado — preencha manualmente.");
  }

  if (!leitura.data.trim()) {
    mensagens.push("Data da nota não identificada — preencha manualmente.");
  }

  if (leitura.itens.length === 0) {
    mensagens.push("Nenhum item identificado na nota.");
  }

  if (divergenciaValor) {
    mensagens.push(
      `A soma dos itens (R$ ${somaItens.toFixed(2)}) difere do valor total da nota (R$ ${valorNota.toFixed(2)}).`
    );
  }

  const itensBaixaConfianca = leitura.itens.filter(
    (item) => item.necessita_revisao && !item.revisado_pelo_usuario
  ).length;

  if (itensBaixaConfianca > 0) {
    mensagens.push(
      `${itensBaixaConfianca} item(ns) precisam de confirmação — ${MENSAGEM_REVISAO_CLASSIFICACAO}`
    );
  }

  return {
    divergenciaValor,
    diferencaValor,
    somaItens,
    valorNota,
    mensagens,
  };
}

export function validarConfirmacao(
  leitura: Pick<NotaFiscalLeitura, "itens">,
  dataNota: string
): string | null {
  const itensComDescricao = leitura.itens.filter((item) =>
    item.descricao.trim()
  );

  if (itensComDescricao.length === 0) {
    return "Inclua ao menos um item com descrição para confirmar.";
  }

  if (!dataNota.trim()) {
    return "Informe a data da nota antes de confirmar.";
  }

  const pendentesRevisao = leitura.itens.filter(
    (item) =>
      item.descricao.trim() &&
      item.necessita_revisao &&
      !item.revisado_pelo_usuario
  );

  if (pendentesRevisao.length > 0) {
    return `${pendentesRevisao.length} item(ns) ainda precisam de confirmação (${MENSAGEM_REVISAO_CLASSIFICACAO})`;
  }

  return null;
}
