import {
  formatMoedaAuditoria,
  formatReferenciaAuditoria,
  registrarAuditoriaSessao,
} from "@/lib/audit-log";
import type { AuditModulo } from "@/lib/audit-constants";
import type { AppSession } from "@/lib/auth";
import { FUNCIONARIO_ROLE, type UserRole } from "@/lib/auth-constants";

type NotaSnapshot = {
  obra_id?: string | null;
  fornecedor?: string | null;
  valor_total?: number | null;
  status_processamento?: string | null;
};

export async function auditarNotaEnviada(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  notaId: string
): Promise<void> {
  const ref = formatReferenciaAuditoria(notaId);
  await registrarAuditoriaSessao(session, {
    modulo: "notas_fiscais",
    acao: "envio",
    descricao: `${session.nome} enviou uma nova nota fiscal #${ref}`,
    tabela: "notas_fiscais",
    registro_id: notaId,
  });
}

export async function auditarNotaAprovada(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  notaId: string,
  antes: NotaSnapshot | null,
  depois: {
    obraId: string;
    fornecedor: string;
    valorTotal: number;
  }
): Promise<void> {
  const ref = formatReferenciaAuditoria(notaId);

  await registrarAuditoriaSessao(session, {
    modulo: "notas_fiscais",
    acao: "aprovacao",
    descricao: `${session.nome} aprovou a nota #${ref}`,
    tabela: "notas_fiscais",
    registro_id: notaId,
  });

  if (antes?.obra_id && antes.obra_id !== depois.obraId) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_obra",
      descricao: `${session.nome} alterou a obra da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }

  if (
    antes?.fornecedor?.trim() &&
    antes.fornecedor.trim() !== depois.fornecedor.trim()
  ) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_fornecedor",
      descricao: `${session.nome} alterou o fornecedor da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }

  if (
    antes?.valor_total != null &&
    Number(antes.valor_total) !== depois.valorTotal
  ) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_valor",
      descricao: `${session.nome} alterou o valor da nota #${ref} (${formatMoedaAuditoria(Number(antes.valor_total))} → ${formatMoedaAuditoria(depois.valorTotal)})`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }

  if (
    antes?.status_processamento &&
    antes.status_processamento !== "aprovada" &&
    antes.status_processamento !== "confirmado"
  ) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_status",
      descricao: `${session.nome} alterou o status da nota #${ref} para Aprovada`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }
}

export async function auditarNotaRejeitada(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  notaId: string
): Promise<void> {
  const ref = formatReferenciaAuditoria(notaId);
  await registrarAuditoriaSessao(session, {
    modulo: "notas_fiscais",
    acao: "rejeicao",
    descricao: `${session.nome} rejeitou a nota #${ref}`,
    tabela: "notas_fiscais",
    registro_id: notaId,
  });
}

export async function auditarNotaCorrecaoSolicitada(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  notaId: string
): Promise<void> {
  const ref = formatReferenciaAuditoria(notaId);
  await registrarAuditoriaSessao(session, {
    modulo: "notas_fiscais",
    acao: "solicitar_correcao",
    descricao: `${session.nome} solicitou correção da nota #${ref}`,
    tabela: "notas_fiscais",
    registro_id: notaId,
  });
}

export async function auditarNotaPendencia(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  notaId: string,
  antes: NotaSnapshot | null,
  depois: {
    obraId: string;
    fornecedor: string;
    valorTotal: number;
  }
): Promise<void> {
  const ref = formatReferenciaAuditoria(notaId);

  await registrarAuditoriaSessao(session, {
    modulo: "notas_fiscais",
    acao: "envio_aprovacao",
    descricao: `${session.nome} enviou a nota #${ref} para aprovação`,
    tabela: "notas_fiscais",
    registro_id: notaId,
  });

  await auditarAlteracoesNota(session, notaId, ref, antes, depois);
}

async function auditarAlteracoesNota(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  notaId: string,
  ref: string,
  antes: NotaSnapshot | null,
  depois: { obraId: string; fornecedor: string; valorTotal: number }
): Promise<void> {
  if (antes?.obra_id && antes.obra_id !== depois.obraId) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_obra",
      descricao: `${session.nome} alterou a obra da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }

  if (
    antes?.fornecedor?.trim() &&
    antes.fornecedor.trim() !== depois.fornecedor.trim()
  ) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_fornecedor",
      descricao: `${session.nome} alterou o fornecedor da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }

  if (
    antes?.valor_total != null &&
    Number(antes.valor_total) !== depois.valorTotal
  ) {
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_valor",
      descricao: `${session.nome} alterou o valor da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: notaId,
    });
  }
}

export async function auditarAuth(
  session: AppSession | null,
  acao: "login" | "logout",
  extra?: { nome?: string; email?: string; role?: UserRole }
): Promise<void> {
  const nome = session?.nome ?? extra?.nome ?? "Usuário";
  const usuario: Pick<AppSession, "userId" | "nome" | "email" | "role"> =
    session ?? {
      userId: "",
      nome,
      email: extra?.email ?? "",
      role: extra?.role ?? FUNCIONARIO_ROLE,
    };

  await registrarAuditoriaSessao(usuario, {
    modulo: "auth",
    acao,
    descricao:
      acao === "login"
        ? `${nome} fez login no sistema`
        : `${nome} saiu do sistema`,
    tabela: "profiles",
    registro_id: session?.userId ?? null,
  });
}

export async function auditarFuncionario(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: {
    acao: string;
    descricao: string;
    registro_id: string;
  }
): Promise<void> {
  await registrarAuditoriaSessao(session, {
    modulo: "funcionarios",
    acao: params.acao,
    descricao: params.descricao,
    tabela: "profiles",
    registro_id: params.registro_id,
  });
}

export async function auditarFuncionarioObras(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: {
    funcionarioNome: string;
    funcionarioId: string;
    userId: string;
    adicionadas: string[];
    reativadas: string[];
    removidas: string[];
  }
): Promise<void> {
  const partes: string[] = [];

  if (params.adicionadas.length > 0) {
    partes.push(`adicionou: ${params.adicionadas.join(", ")}`);
  }
  if (params.reativadas.length > 0) {
    partes.push(`reativou: ${params.reativadas.join(", ")}`);
  }
  if (params.removidas.length > 0) {
    partes.push(`removeu: ${params.removidas.join(", ")}`);
  }

  if (partes.length === 0) return;

  await registrarAuditoriaSessao(session, {
    modulo: "funcionarios",
    acao: "alteracao_obras_autorizadas",
    descricao: `${session.nome} alterou obras autorizadas de ${params.funcionarioNome} (${partes.join("; ")})`,
    tabela: "funcionario_obras",
    registro_id: params.funcionarioId,
  });
}

export async function auditarAcompanhamentoEnviado(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: {
    acompanhamentoId: string;
    obraNome: string;
    funcionarioNome: string;
    totalFotos: number;
  }
): Promise<void> {
  await registrarAuditoriaSessao(session, {
    modulo: "obras",
    acao: "acompanhamento_enviado",
    descricao: `${params.funcionarioNome} enviou acompanhamento da obra ${params.obraNome} (${params.totalFotos} foto${params.totalFotos === 1 ? "" : "s"})`,
    tabela: "acompanhamento_obras",
    registro_id: params.acompanhamentoId,
  });
}

export async function auditarAcompanhamentoDesativado(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: {
    acompanhamentoId: string;
    obraNome: string;
    funcionarioNome: string;
  }
): Promise<void> {
  await registrarAuditoriaSessao(session, {
    modulo: "obras",
    acao: "acompanhamento_desativado",
    descricao: `${session.nome} ocultou acompanhamento de ${params.funcionarioNome} na obra ${params.obraNome}`,
    tabela: "acompanhamento_obras",
    registro_id: params.acompanhamentoId,
  });
}

type ObraCamposAuditoria = {
  nome: string;
  cliente_id: string;
  status: string;
  orcamento_previsto: number | null;
  data_inicio: string | null;
  data_previsao_termino: string | null;
  area_m2: number | null;
  observacoes: string | null;
};

function resumirAlteracoesObra(
  antes: ObraCamposAuditoria,
  depois: ObraCamposAuditoria
): string[] {
  const mudancas: string[] = [];
  if (antes.nome !== depois.nome) mudancas.push("nome");
  if (antes.cliente_id !== depois.cliente_id) mudancas.push("cliente");
  if (antes.status !== depois.status) mudancas.push("status");
  if (Number(antes.orcamento_previsto ?? 0) !== Number(depois.orcamento_previsto ?? 0)) {
    mudancas.push(
      `orçamento (${formatMoedaAuditoria(Number(antes.orcamento_previsto ?? 0))} → ${formatMoedaAuditoria(Number(depois.orcamento_previsto ?? 0))})`
    );
  }
  if (antes.data_inicio !== depois.data_inicio) mudancas.push("data de início");
  if (antes.data_previsao_termino !== depois.data_previsao_termino) {
    mudancas.push("previsão de término");
  }
  if (Number(antes.area_m2 ?? 0) !== Number(depois.area_m2 ?? 0)) mudancas.push("área");
  if ((antes.observacoes ?? "") !== (depois.observacoes ?? "")) {
    mudancas.push("observações");
  }
  return mudancas;
}

export async function auditarObraAlterada(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: {
    obraId: string;
    obraNome: string;
    antes: ObraCamposAuditoria;
    depois: ObraCamposAuditoria;
  }
): Promise<void> {
  const mudancas = resumirAlteracoesObra(params.antes, params.depois);
  if (mudancas.length === 0) return;

  await registrarAuditoriaSessao(session, {
    modulo: "obras",
    acao: "edicao",
    descricao: `${session.nome} alterou a obra ${params.obraNome}: ${mudancas.join(", ")}`,
    tabela: "obras",
    registro_id: params.obraId,
  });
}

export async function auditarRecebimentoObra(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role">,
  params: {
    acao: "criacao" | "edicao" | "exclusao";
    obraId: string;
    obraNome: string;
    recebimentoId: string;
    valor: number;
    valorAnterior?: number;
  }
): Promise<void> {
  const rotulo = formatMoedaAuditoria(params.valor);
  let descricao: string;

  switch (params.acao) {
    case "criacao":
      descricao = `${session.nome} registrou recebimento de ${rotulo} na obra ${params.obraNome}`;
      break;
    case "edicao":
      descricao = `${session.nome} alterou recebimento na obra ${params.obraNome} (${formatMoedaAuditoria(params.valorAnterior ?? 0)} → ${rotulo})`;
      break;
    case "exclusao":
      descricao = `${session.nome} excluiu recebimento de ${rotulo} na obra ${params.obraNome}`;
      break;
  }

  await registrarAuditoriaSessao(session, {
    modulo: "obras",
    acao: params.acao,
    descricao,
    tabela: "obra_recebimentos",
    registro_id: params.recebimentoId,
  });
}

export async function auditarRegistroCrud(
  session: Pick<AppSession, "userId" | "nome" | "email" | "role"> | null,
  params: {
    modulo: Extract<AuditModulo, "obras" | "clientes" | "financeiro">;
    acao: "criacao" | "edicao" | "exclusao";
    tabela: string;
    registro_id: string;
    descricao: string;
  }
): Promise<void> {
  if (!session) return;
  await registrarAuditoriaSessao(session, {
    modulo: params.modulo,
    acao: params.acao,
    descricao: params.descricao,
    tabela: params.tabela,
    registro_id: params.registro_id,
  });
}
