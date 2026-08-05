"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
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

function gerarTituloConversa(pergunta: string): string {
  const limpa = pergunta.trim().replace(/\s+/g, " ");
  return limpa.length > 60 ? `${limpa.slice(0, 57)}...` : limpa;
}

export async function listarConversasEngenheiroCedro(): Promise<ConversaAssistente[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assistente_conversas")
    .select("id, titulo, obra_id, criado_em, atualizado_em")
    .order("atualizado_em", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[EngenheiroCedro] listarConversas:", error.message);
    return [];
  }

  return (data ?? []) as ConversaAssistente[];
}

export async function carregarMensagensConversa(
  conversaId: string
): Promise<MensagemAssistente[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assistente_mensagens")
    .select("id, role, conteudo, metadados, intent, fonte, criado_em")
    .eq("conversa_id", conversaId)
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("[EngenheiroCedro] carregarMensagens:", error.message);
    return [];
  }

  return (data ?? []) as MensagemAssistente[];
}

export async function criarConversaEngenheiroCedro(
  obraId?: string | null
): Promise<ConversaAssistente | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assistente_conversas")
    .insert({
      titulo: "Nova conversa",
      obra_id: obraId ?? null,
    })
    .select("id, titulo, obra_id, criado_em, atualizado_em")
    .single();

  if (error) {
    console.error("[EngenheiroCedro] criarConversa:", error.message);
    return null;
  }

  return data as ConversaAssistente;
}

export async function excluirConversaEngenheiroCedro(
  conversaId: string
): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("assistente_conversas")
    .delete()
    .eq("id", conversaId);

  return !error;
}

export async function enviarMensagemEngenheiroCedro(
  pergunta: string,
  conversaId?: string | null,
  obraId?: string | null
): Promise<EnviarMensagemResultado> {
  const texto = pergunta.trim();
  if (!texto) {
    throw new Error("Digite uma pergunta.");
  }

  const supabase = createSupabaseServerClient();
  let conversaAtualId = conversaId ?? null;

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
    throw new Error(errAssistente?.message ?? "Erro ao salvar resposta.");
  }

  await supabase
    .from("assistente_conversas")
    .update({
      titulo: gerarTituloConversa(texto),
      obra_id: obraId ?? null,
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
