"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import {
  atualizarAnotacaoPessoal,
  criarAnotacaoPessoal,
  excluirAnotacaoPessoal,
  listarAnotacoesPessoais,
  type AnotacaoPessoalRow,
} from "@/lib/anotacoes-pessoais";
import { parseMoedaBr } from "@/lib/moeda-br";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const REVALIDAR = ["/admin/anotacoes"];

export type AnotacaoActionState = {
  erro?: string;
  sucesso?: string;
};

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseFormAnotacao(formData: FormData) {
  const data = String(formData.get("data") ?? "").trim() || hojeIso();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!descricao) {
    return { erro: "Descrição é obrigatória." as const };
  }

  const valor =
    valorRaw && parseMoedaBr(valorRaw) > 0 ? parseMoedaBr(valorRaw) : null;

  return {
    data: {
      data,
      descricao,
      categoria: categoria || null,
      valor,
      observacao: observacao || null,
    },
  };
}

export async function listarAnotacoesPessoaisAction(): Promise<
  AnotacaoPessoalRow[]
> {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  return listarAnotacoesPessoais(supabase, session.userId);
}

export async function criarAnotacaoPessoalAction(
  formData: FormData
): Promise<AnotacaoActionState> {
  try {
    const session = await requireAdminSession();
    const parsed = parseFormAnotacao(formData);

    if ("erro" in parsed) {
      return { erro: parsed.erro };
    }

    const supabase = await createSupabaseServerClient();
    await criarAnotacaoPessoal(supabase, session.userId, parsed.data);

    revalidatePath(REVALIDAR[0]);
    return { sucesso: "Anotação criada com sucesso." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao criar anotação.",
    };
  }
}

export async function atualizarAnotacaoPessoalAction(
  id: string,
  formData: FormData
): Promise<AnotacaoActionState> {
  try {
    const session = await requireAdminSession();
    const parsed = parseFormAnotacao(formData);

    if ("erro" in parsed) {
      return { erro: parsed.erro };
    }

    const supabase = await createSupabaseServerClient();
    await atualizarAnotacaoPessoal(
      supabase,
      session.userId,
      id,
      parsed.data
    );

    revalidatePath(REVALIDAR[0]);
    return { sucesso: "Anotação atualizada com sucesso." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao atualizar anotação.",
    };
  }
}

export async function excluirAnotacaoPessoalAction(
  id: string
): Promise<AnotacaoActionState> {
  try {
    const session = await requireAdminSession();
    const supabase = await createSupabaseServerClient();
    await excluirAnotacaoPessoal(supabase, session.userId, id);

    revalidatePath(REVALIDAR[0]);
    return { sucesso: "Anotação excluída." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao excluir anotação.",
    };
  }
}
