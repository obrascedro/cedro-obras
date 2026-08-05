import type { SupabaseClient } from "@supabase/supabase-js";
import { recalcularFinanceiroObra } from "@/lib/gastos-obra";
import { salvarClassificacaoAprendida } from "@/lib/nota-fiscal-classificacao-aprendida";
import { registrarEventoNotaFiscal } from "@/lib/nota-fiscal-eventos";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import {
  formatDescricaoComUnidade,
  montarObservacoesNota,
  type NotaFiscalItemExtraido,
} from "@/lib/nota-fiscal-ia";
import { validarConfirmacao } from "@/lib/nota-fiscal-validacao";
import {
  isPendenteAprovacao,
  STATUS_APROVADA,
  STATUS_PENDENTE_APROVACAO,
} from "@/lib/notas-fiscais-status";

export type AprovarNotaParams = {
  notaId: string;
  obraId: string;
  fornecedor: string;
  cnpj: string;
  dataNota: string;
  valorTotal: number;
  observacoes?: string;
  itens: NotaFiscalItemExtraido[];
  aprovadorId?: string | null;
  aprovadorNome: string;
};

type RejeitarNotaParams = {
  notaId: string;
  motivo: string;
  rejeitadoPorId?: string | null;
  rejeitadoPorNome: string;
};

type SolicitarCorrecaoParams = {
  notaId: string;
  mensagem: string;
  solicitadoPorId?: string | null;
  solicitadoPorNome: string;
};

export async function aprovarNotaFiscalServer(
  client: SupabaseClient,
  params: AprovarNotaParams
) {
  logNotaFiscal("aprovacao.inicio", {
    notaId: params.notaId,
    aprovador: params.aprovadorNome,
  });

  const erroValidacao = validarConfirmacao({ itens: params.itens }, params.dataNota);
  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  const { data: notaAtual, error: fetchError } = await client
    .from("notas_fiscais")
    .select("status_processamento, obra_id")
    .eq("id", params.notaId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!isPendenteAprovacao(notaAtual?.status_processamento ?? "")) {
    if (notaAtual?.status_processamento === STATUS_APROVADA || notaAtual?.status_processamento === "confirmado") {
      throw new Error("Esta nota já foi aprovada.");
    }
    throw new Error("A nota não está pendente de aprovação.");
  }

  const itensParaGravar = params.itens.filter(
    (item) =>
      item.descricao.trim() &&
      (!item.necessita_revisao || item.revisado_pelo_usuario)
  );

  const gastosPayload = itensParaGravar.map((item) => ({
    obra_id: params.obraId,
    etapa: item.etapa.trim() || "Não classificado",
    categoria: item.categoria.trim() || "Outros",
    descricao: formatDescricaoComUnidade(item),
    fornecedor: params.fornecedor.trim() || null,
    quantidade: item.quantidade,
    valor_unitario: item.valor_unitario,
    valor_total: item.valor_total,
    data_gasto: params.dataNota || null,
  }));

  const { error: insertError } = await client
    .from("gastos_obra")
    .insert(gastosPayload);

  if (insertError) {
    logNotaFiscalError("aprovacao.gastos.erro", insertError);
    throw insertError;
  }

  const agora = new Date().toISOString();

  const { data: notaAtualizada, error: updateError } = await client
    .from("notas_fiscais")
    .update({
      obra_id: params.obraId,
      fornecedor: params.fornecedor.trim() || null,
      data_nota: params.dataNota || null,
      valor_total: params.valorTotal,
      observacoes: montarObservacoesNota(params.cnpj, params.observacoes ?? ""),
      status_processamento: STATUS_APROVADA,
      aprovado_por: params.aprovadorId ?? null,
      aprovado_por_nome: params.aprovadorNome,
      aprovado_em: agora,
      itens_json: params.itens,
    })
    .eq("id", params.notaId)
    .in("status_processamento", [STATUS_PENDENTE_APROVACAO, "revisar"])
    .select("id");

  if (updateError) {
    logNotaFiscalError("aprovacao.nota.erro", updateError);
    throw updateError;
  }

  if (!notaAtualizada?.length) {
    throw new Error(
      "Gastos lançados, mas a nota já foi aprovada ou o status mudou."
    );
  }

  for (const item of params.itens) {
    if (item.descricao.trim() && item.revisado_pelo_usuario) {
      try {
        await salvarClassificacaoAprendida(
          item.descricao,
          item.categoria,
          item.etapa,
          client
        );
      } catch {
        // não bloqueia aprovação
      }
    }
  }

  await registrarEventoNotaFiscal(client, {
    notaId: params.notaId,
    acao: "aprovada",
    usuarioId: params.aprovadorId,
    usuarioNome: params.aprovadorNome,
    detalhes: {
      totalItens: gastosPayload.length,
      valorTotal: params.valorTotal,
    },
  });

  const financeiro = await recalcularFinanceiroObra(params.obraId, client);

  logNotaFiscal("aprovacao.sucesso", {
    notaId: params.notaId,
    gastoRealizado: financeiro.gastoRealizado,
  });

  return financeiro;
}

export async function rejeitarNotaFiscalServer(
  client: SupabaseClient,
  params: RejeitarNotaParams
) {
  if (!params.motivo.trim()) {
    throw new Error("Informe o motivo da rejeição.");
  }

  const agora = new Date().toISOString();

  const { data, error } = await client
    .from("notas_fiscais")
    .update({
      status_processamento: "rejeitada",
      rejeitado_por: params.rejeitadoPorId ?? null,
      rejeitado_por_nome: params.rejeitadoPorNome,
      rejeitado_em: agora,
      motivo_rejeicao: params.motivo.trim(),
    })
    .eq("id", params.notaId)
    .in("status_processamento", [STATUS_PENDENTE_APROVACAO, "revisar"])
    .select("id");

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("Nota não encontrada ou já processada.");
  }

  await registrarEventoNotaFiscal(client, {
    notaId: params.notaId,
    acao: "rejeitada",
    usuarioId: params.rejeitadoPorId,
    usuarioNome: params.rejeitadoPorNome,
    detalhes: { motivo: params.motivo.trim() },
  });
}

export async function solicitarCorrecaoNotaFiscalServer(
  client: SupabaseClient,
  params: SolicitarCorrecaoParams
) {
  if (!params.mensagem.trim()) {
    throw new Error("Informe a mensagem de correção.");
  }

  const { data, error } = await client
    .from("notas_fiscais")
    .update({
      status_processamento: "correcao_solicitada",
      mensagem_correcao: params.mensagem.trim(),
    })
    .eq("id", params.notaId)
    .in("status_processamento", [STATUS_PENDENTE_APROVACAO, "revisar"])
    .select("id");

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("Nota não encontrada ou já processada.");
  }

  await registrarEventoNotaFiscal(client, {
    notaId: params.notaId,
    acao: "correcao_solicitada",
    usuarioId: params.solicitadoPorId,
    usuarioNome: params.solicitadoPorNome,
    detalhes: { mensagem: params.mensagem.trim() },
  });
}

export async function salvarPendenciaNotaFiscalServer(
  client: SupabaseClient,
  params: {
    notaId: string;
    obraId: string;
    fornecedor: string;
    cnpj: string;
    dataNota: string;
    valorTotal: number;
    observacoes?: string;
    itens: NotaFiscalItemExtraido[];
    enviadoPorNome: string;
  }
) {
  const leituraJson = {
    fornecedor: params.fornecedor,
    cnpj: params.cnpj,
    data: params.dataNota,
    valor_total: params.valorTotal,
  };

  const { error } = await client
    .from("notas_fiscais")
    .update({
      obra_id: params.obraId,
      fornecedor: params.fornecedor.trim() || null,
      data_nota: params.dataNota || null,
      valor_total: params.valorTotal,
      observacoes: montarObservacoesNota(params.cnpj, params.observacoes ?? ""),
      status_processamento: STATUS_PENDENTE_APROVACAO,
      enviado_por_nome: params.enviadoPorNome,
      leitura_json: leituraJson,
      itens_json: params.itens,
    })
    .eq("id", params.notaId);

  if (error) throw new Error(error.message);

  await registrarEventoNotaFiscal(client, {
    notaId: params.notaId,
    acao: "enviada",
    usuarioNome: params.enviadoPorNome,
    detalhes: { totalItens: params.itens.length },
  });
}
