"use server";

import { revalidatePath } from "next/cache";
import { ACOMPANHAMENTO_OBRAS_BUCKET } from "@/lib/acompanhamento-obras/config";
import {
  listarAcompanhamentosAdmin,
  listarAcompanhamentosPorObra,
  obterAcompanhamentoAdminBypass,
  obterStatsDashboardAcompanhamento,
  type FiltrosAcompanhamentoAdmin,
} from "@/lib/acompanhamento-obras/listar";
import type {
  AcompanhamentoDetalhe,
  AcompanhamentoResumo,
} from "@/lib/acompanhamento-obras/types";
import { auditarAcompanhamentoDesativado } from "@/lib/audit-helpers";
import { requireAdminSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function listarAcompanhamentosAdminAction(
  filtros: FiltrosAcompanhamentoAdmin = {}
): Promise<AcompanhamentoResumo[]> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  return listarAcompanhamentosAdmin(supabase, filtros);
}

export async function obterAcompanhamentoAdminAction(
  id: string
): Promise<{ detalhe: AcompanhamentoDetalhe | null; erro?: string }> {
  try {
    await requireAdminSession();
    const admin = createSupabaseAdminClient();
    const detalhe = await obterAcompanhamentoAdminBypass(admin, id);
    if (!detalhe) {
      return {
        detalhe: null,
        erro: "Atualização não encontrada ou sem permissão para visualizar.",
      };
    }
    return { detalhe };
  } catch (error) {
    console.error("[admin/acompanhamento] obterDetalhe", error);
    return {
      detalhe: null,
      erro: "Não foi possível carregar os detalhes desta atualização.",
    };
  }
}

export async function listarAcompanhamentosPorObraAction(
  obraId: string
): Promise<AcompanhamentoResumo[]> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  return listarAcompanhamentosPorObra(supabase, obraId);
}

export async function obterUrlFotoAcompanhamentoAdminAction(
  storagePath: string
): Promise<{ url?: string; erro?: string }> {
  try {
    await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin.storage
      .from(ACOMPANHAMENTO_OBRAS_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      console.error("[admin/acompanhamento] signedUrl.erro", error?.message);
      return { erro: "Não foi possível carregar a imagem." };
    }

    return { url: data.signedUrl };
  } catch {
    return { erro: "Não autorizado." };
  }
}

export async function desativarAcompanhamentoAdminAction(
  id: string
): Promise<{ sucesso?: string; erro?: string }> {
  try {
    const session = await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const { data: atual } = await admin
      .from("acompanhamento_obras")
      .select("id, ativo, obras(nome), portal_funcionarios(nome)")
      .eq("id", id)
      .maybeSingle();

    if (!atual) return { erro: "Atualização não encontrada." };

    const { error } = await admin
      .from("acompanhamento_obras")
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      console.error("[admin/acompanhamento] desativar.erro", error.message);
      return { erro: "Não foi possível ocultar a atualização." };
    }

    const obraNome = Array.isArray(atual.obras)
      ? atual.obras[0]?.nome
      : (atual.obras as { nome: string } | null)?.nome;
    const funcNome = Array.isArray(atual.portal_funcionarios)
      ? atual.portal_funcionarios[0]?.nome
      : (atual.portal_funcionarios as { nome: string } | null)?.nome;

    await auditarAcompanhamentoDesativado(session, {
      acompanhamentoId: id,
      obraNome: obraNome ?? "—",
      funcionarioNome: funcNome ?? "—",
    });

    revalidatePath("/acompanhamento-obras");
    revalidatePath(`/acompanhamento-obras/${id}`);
    revalidatePath("/dashboard");
    return { sucesso: "Atualização ocultada." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao ocultar atualização.",
    };
  }
}

export async function obterStatsDashboardAcompanhamentoAction() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  return obterStatsDashboardAcompanhamento(supabase);
}

export async function listarObrasEFuncionariosAdminAction(): Promise<{
  obras: { id: string; nome: string }[];
  funcionarios: { id: string; nome: string }[];
}> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const [{ data: obras }, { data: funcionarios }] = await Promise.all([
    supabase.from("obras").select("id, nome").order("nome"),
    supabase
      .from("portal_funcionarios")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return {
    obras: (obras ?? []).map((o) => ({ id: String(o.id), nome: String(o.nome) })),
    funcionarios: (funcionarios ?? []).map((f) => ({
      id: String(f.id),
      nome: String(f.nome),
    })),
  };
}
