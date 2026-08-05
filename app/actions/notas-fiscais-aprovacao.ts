"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  aprovarNotaFiscalServer,
  rejeitarNotaFiscalServer,
  salvarPendenciaNotaFiscalServer,
  solicitarCorrecaoNotaFiscalServer,
} from "@/lib/aprovar-nota-fiscal";
import type { PerfilNotaFiscal } from "@/lib/nota-fiscal-perfil";
import { podeAprovarNotas } from "@/lib/nota-fiscal-perfil";
import type { NotaFiscalItemExtraido } from "@/lib/nota-fiscal-ia";

function assertAprovador(perfil: PerfilNotaFiscal) {
  if (!podeAprovarNotas(perfil)) {
    throw new Error("Apenas aprovadores podem executar esta ação.");
  }
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
  perfil: PerfilNotaFiscal;
}) {
  assertAprovador(params.perfil);

  const client = createSupabaseServerClient();
  return aprovarNotaFiscalServer(client, {
    notaId: params.notaId,
    obraId: params.obraId,
    fornecedor: params.fornecedor,
    cnpj: params.cnpj,
    dataNota: params.dataNota,
    valorTotal: params.valorTotal,
    observacoes: params.observacoes,
    itens: params.itens,
    aprovadorNome: params.aprovadorNome,
  });
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
  perfil: PerfilNotaFiscal;
}) {
  assertAprovador(params.perfil);

  const client = createSupabaseServerClient();
  await rejeitarNotaFiscalServer(client, {
    notaId: params.notaId,
    motivo: params.motivo,
    rejeitadoPorNome: params.rejeitadoPorNome,
  });
}

export async function solicitarCorrecaoNotaFiscalAction(params: {
  notaId: string;
  mensagem: string;
  solicitadoPorNome: string;
  perfil: PerfilNotaFiscal;
}) {
  assertAprovador(params.perfil);

  const client = createSupabaseServerClient();
  await solicitarCorrecaoNotaFiscalServer(client, {
    notaId: params.notaId,
    mensagem: params.mensagem,
    solicitadoPorNome: params.solicitadoPorNome,
  });
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
  const client = createSupabaseServerClient();
  await salvarPendenciaNotaFiscalServer(client, params);
}
