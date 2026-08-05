"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminSession } from "@/lib/auth";
import { processarPerguntaEngenheiroCedro } from "@/lib/engenheiro-cedro-resposta";
import type {
  ConversaAssistente,
  MensagemAssistente,
  RespostaEngenheiroCedro,
} from "@/lib/engenheiro-cedro-types";

export type EnviarMensagemResultado = {
  conversaId: string;
  resposta: RespostaEngenheiroCedro;
  mensagemUsuario: MensagemAssistente;
  mensagemAssistente: MensagemAssistente;
};

export type StorageAssistenteStatus = {
  disponivel: boolean;
  aviso?: string;
};

const AVISO_TABELA_INEXISTENTE =
  "O histórico de conversas ainda não está configurado no banco. Execute supabase/assistente-conversas.sql no SQL Editor do Supabase para habilitar o salvamento.";

function erroTabelaAssistenteInexistente(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("assistente_conversas") &&
    (m.includes("schema cache") ||
      m.includes("does not exist") ||
      m.includes("could not find"))
  );
}

function erroStorageAssistente(error: { message: string } | null): boolean {
  return Boolean(error && erroTabelaAssistenteInexistente(error.message));
}

function gerarTituloConversa(pergunta: string): string {
  const limpa = pergunta.trim().replace(/\s+/g, " ");
  return limpa.length > 60 ? `${limpa.slice(0, 57)}...` : limpa;
}

export async function obterStatusStorageAssistente(): Promise<StorageAssistenteStatus> {
  try {
    await requireAdminSession();
  } catch {
    return { disponivel: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("assistente_conversas")
    .select("id")
    .limit(1);

  if (erroStorageAssistente(error)) {
    return { disponivel: false, aviso: AVISO_TABELA_INEXISTENTE };
  }

  if (error) {
    console.error("[EngenheiroCedro] obterStatusStorage:", error.message);
    return { disponivel: false, aviso: "Não foi possível verificar o histórico de conversas." };
  }

  return { disponivel: true };
}

async function assertConversaDoUsuario(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conversaId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("assistente_conversas")
    .select("id")
    .eq("id", conversaId)
    .or(`usuario_id.eq.${userId},usuario_id.is.null`)
    .maybeSingle();

  if (erroStorageAssistente(error)) return false;

  return Boolean(data);
}

export async function listarConversasEngenheiroCedro(): Promise<ConversaAssistente[]> {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assistente_conversas")
    .select("id, titulo, obra_id, criado_em, atualizado_em")
    .or(`usuario_id.eq.${session.userId},usuario_id.is.null`)
    .order("atualizado_em", { ascending: false })
    .limit(30);

  if (error) {
    if (!erroStorageAssistente(error)) {
      console.error("[EngenheiroCedro] listarConversas:", error.message);
    }
    return [];
  }

  return (data ?? []) as ConversaAssistente[];
}

export async function carregarMensagensConversa(
  conversaId: string
): Promise<MensagemAssistente[]> {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const permitido = await assertConversaDoUsuario(
    supabase,
    conversaId,
    session.userId
  );
  if (!permitido) return [];

  const { data, error } = await supabase
    .from("assistente_mensagens")
    .select("id, role, conteudo, metadados, intent, fonte, criado_em")
    .eq("conversa_id", conversaId)
    .order("criado_em", { ascending: true });

  if (error) {
    if (!erroStorageAssistente(error)) {
      console.error("[EngenheiroCedro] carregarMensagens:", error.message);
    }
    return [];
  }

  return (data ?? []) as MensagemAssistente[];
}

export async function criarConversaEngenheiroCedro(
  obraId?: string | null
): Promise<ConversaAssistente | null> {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assistente_conversas")
    .insert({
      titulo: "Nova conversa",
      obra_id: obraId ?? null,
      usuario_id: session.userId,
    })
    .select("id, titulo, obra_id, criado_em, atualizado_em")
    .single();

  if (error) {
    if (erroStorageAssistente(error)) {
      throw new Error(AVISO_TABELA_INEXISTENTE);
    }
    console.error("[EngenheiroCedro] criarConversa:", error.message);
    return null;
  }

  return data as ConversaAssistente;
}

export async function excluirConversaEngenheiroCedro(
  conversaId: string
): Promise<boolean> {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const permitido = await assertConversaDoUsuario(
    supabase,
    conversaId,
    session.userId
  );
  if (!permitido) return false;

  const { error } = await supabase
    .from("assistente_conversas")
    .delete()
    .eq("id", conversaId);

  if (erroStorageAssistente(error)) return false;

  return !error;
}

export async function enviarMensagemEngenheiroCedro(
  pergunta: string,
  conversaId?: string | null,
  obraId?: string | null
): Promise<EnviarMensagemResultado> {
  const session = await requireAdminSession();
  const texto = pergunta.trim();
  if (!texto) {
    throw new Error("Digite uma pergunta.");
  }

  const storage = await obterStatusStorageAssistente();
  if (!storage.disponivel) {
    throw new Error(storage.aviso ?? AVISO_TABELA_INEXISTENTE);
  }

  const supabase = await createSupabaseServerClient();
  let conversaAtualId = conversaId ?? null;

  if (conversaAtualId) {
    const permitido = await assertConversaDoUsuario(
      supabase,
      conversaAtualId,
      session.userId
    );
    if (!permitido) {
      throw new Error("Conversa não encontrada ou sem permissão.");
    }
  }

  if (!conversaAtualId) {
    const nova = await criarConversaEngenheiroCedro(obraId);
    if (!nova) throw new Error("Não foi possível criar a conversa.");
    conversaAtualId = nova.id;
  }

  const resposta = await processarPerguntaEngenheiroCedro(
    supabase,
    texto,
    obraId
  );

  const { data: msgUsuario, error: errUsuario } = await supabase
    .from("assistente_mensagens")
    .insert({
      conversa_id: conversaAtualId,
      role: "user",
      conteudo: texto,
    })
    .select("id, role, conteudo, metadados, intent, fonte, criado_em")
    .single();

  if (errUsuario || !msgUsuario) {
    if (erroStorageAssistente(errUsuario)) {
      throw new Error(AVISO_TABELA_INEXISTENTE);
    }
    throw new Error(errUsuario?.message ?? "Erro ao salvar pergunta.");
  }

  const metadados = {
    indicadores: resposta.indicadores,
    graficos: resposta.graficos,
    intent: resposta.intent,
    fonte: resposta.fonte,
  };

  const { data: msgAssistente, error: errAssistente } = await supabase
    .from("assistente_mensagens")
    .insert({
      conversa_id: conversaAtualId,
      role: "assistant",
      conteudo: resposta.texto,
      metadados,
      intent: resposta.intent,
      fonte: resposta.fonte,
    })
    .select("id, role, conteudo, metadados, intent, fonte, criado_em")
    .single();

  if (errAssistente || !msgAssistente) {
    if (erroStorageAssistente(errAssistente)) {
      throw new Error(AVISO_TABELA_INEXISTENTE);
    }
    throw new Error(errAssistente?.message ?? "Erro ao salvar resposta.");
  }

  await supabase
    .from("assistente_conversas")
    .update({
      titulo: gerarTituloConversa(texto),
      obra_id: obraId ?? null,
      usuario_id: session.userId,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", conversaAtualId);

  return {
    conversaId: conversaAtualId,
    resposta,
    mensagemUsuario: msgUsuario as MensagemAssistente,
    mensagemAssistente: msgAssistente as MensagemAssistente,
  };
}
