"use server";

import { requireAdminSession } from "@/lib/auth";
import {
  auditarNotaAprovada,
  auditarNotaCorrecaoSolicitada,
  auditarNotaPendencia,
  auditarNotaRejeitada,
} from "@/lib/audit-helpers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  aprovarNotaFiscalServer,
  rejeitarNotaFiscalServer,
  salvarPendenciaNotaFiscalServer,
  solicitarCorrecaoNotaFiscalServer,
} from "@/lib/aprovar-nota-fiscal";
import type { NotaFiscalItemExtraido } from "@/lib/nota-fiscal-ia";
import {
  formatReferenciaAuditoria,
  registrarAuditoriaSessao,
} from "@/lib/audit-log";

type NotaAntes = {
  obra_id: string | null;
  fornecedor: string | null;
  valor_total: number | null;
  status_processamento: string | null;
  itens_json: unknown;
};

async function buscarNotaAntes(
  notaId: string
): Promise<NotaAntes | null> {
  const client = await createSupabaseServerClient();
  const { data } = await client
    .from("notas_fiscais")
    .select(
      "obra_id, fornecedor, valor_total, status_processamento, itens_json"
    )
    .eq("id", notaId)
    .maybeSingle();
  return data;
}

function categoriasAlteradas(
  antes: unknown,
  depois: NotaFiscalItemExtraido[]
): boolean {
  const extrair = (items: unknown) => {
    if (!Array.isArray(items)) return "";
    return items
      .map((item) => {
        const row = item as { categoria?: string };
        return row.categoria?.trim() ?? "";
      })
      .join("|");
  };
  return extrair(antes) !== extrair(depois);
}

export async function aprovarNotaFiscalAction(params: {
  notaId: string;
  obraId: string;
  fornecedor: string;
  cnpj: string;
  dataNota: string;
  valorTotal: number;
  observacoes?: string;
  itens: NotaFiscalItemExtraido[];
  aprovadorNome: string;
}) {
  const session = await requireAdminSession();

  const client = await createSupabaseServerClient();
  const antes = await buscarNotaAntes(params.notaId);

  const result = await aprovarNotaFiscalServer(client, {
    notaId: params.notaId,
    obraId: params.obraId,
    fornecedor: params.fornecedor,
    cnpj: params.cnpj,
    dataNota: params.dataNota,
    valorTotal: params.valorTotal,
    observacoes: params.observacoes,
    itens: params.itens,
    aprovadorNome: params.aprovadorNome || session.nome,
    aprovadorId: session.userId,
  });

  await auditarNotaAprovada(session, params.notaId, antes, {
    obraId: params.obraId,
    fornecedor: params.fornecedor,
    valorTotal: params.valorTotal,
  });

  if (categoriasAlteradas(antes?.itens_json, params.itens)) {
    const ref = formatReferenciaAuditoria(params.notaId);
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_categoria",
      descricao: `${session.nome} alterou a categoria da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: params.notaId,
    });
  }

  return result;
}

export async function editarEAprovarNotaFiscalAction(
  params: Parameters<typeof aprovarNotaFiscalAction>[0]
) {
  return aprovarNotaFiscalAction(params);
}

export async function rejeitarNotaFiscalAction(params: {
  notaId: string;
  motivo: string;
  rejeitadoPorNome: string;
}) {
  const session = await requireAdminSession();

  const client = await createSupabaseServerClient();
  await rejeitarNotaFiscalServer(client, {
    notaId: params.notaId,
    motivo: params.motivo,
    rejeitadoPorNome: params.rejeitadoPorNome || session.nome,
    rejeitadoPorId: session.userId,
  });

  await auditarNotaRejeitada(session, params.notaId);
}

export async function solicitarCorrecaoNotaFiscalAction(params: {
  notaId: string;
  mensagem: string;
  solicitadoPorNome: string;
}) {
  const session = await requireAdminSession();

  const client = await createSupabaseServerClient();
  await solicitarCorrecaoNotaFiscalServer(client, {
    notaId: params.notaId,
    mensagem: params.mensagem,
    solicitadoPorNome: params.solicitadoPorNome || session.nome,
  });

  await auditarNotaCorrecaoSolicitada(session, params.notaId);
}

export async function enviarNotaParaAprovacaoAction(params: {
  notaId: string;
  obraId: string;
  fornecedor: string;
  cnpj: string;
  dataNota: string;
  valorTotal: number;
  observacoes?: string;
  itens: NotaFiscalItemExtraido[];
  enviadoPorNome: string;
}) {
  const session = await requireAdminSession();
  const client = await createSupabaseServerClient();
  const antes = await buscarNotaAntes(params.notaId);

  await salvarPendenciaNotaFiscalServer(client, params);

  await auditarNotaPendencia(session, params.notaId, antes, {
    obraId: params.obraId,
    fornecedor: params.fornecedor,
    valorTotal: params.valorTotal,
  });

  if (categoriasAlteradas(antes?.itens_json, params.itens)) {
    const ref = formatReferenciaAuditoria(params.notaId);
    await registrarAuditoriaSessao(session, {
      modulo: "notas_fiscais",
      acao: "alteracao_categoria",
      descricao: `${session.nome} alterou a categoria da nota #${ref}`,
      tabela: "notas_fiscais",
      registro_id: params.notaId,
    });
  }
}
