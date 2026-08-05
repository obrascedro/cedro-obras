"use server";

import { revalidatePath } from "next/cache";
import { ETAPA_OUTRO, isEtapaObraValida } from "@/lib/acompanhamento-obras/etapas";
import { ACOMPANHAMENTO_MSG, ACOMPANHAMENTO_OBRAS_BUCKET } from "@/lib/acompanhamento-obras/config";
import {
  listarAcompanhamentosPortal,
  obterAcompanhamentoPortal,
} from "@/lib/acompanhamento-obras/listar";
import { salvarAcompanhamentoObra } from "@/lib/acompanhamento-obras/salvar-atualizacao";
import { lerFotosAcompanhamento } from "@/lib/acompanhamento-obras/validar-fotos";
import type { AcompanhamentoDetalhe, AcompanhamentoResumo } from "@/lib/acompanhamento-obras/types";
import { auditarAcompanhamentoEnviado } from "@/lib/audit-helpers";
import { requirePortalSession } from "@/lib/auth";
import { funcionarioPodeEnviarNotaParaObra } from "@/lib/portal-notas/obras-funcionario";
import { buscarFuncionarioPortalPorId } from "@/lib/portal-notas/funcionarios";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type PortalAcompanhamentoState = {
  erro?: string;
  sucesso?: {
    id: string;
    obraNome: string;
    totalFotos: number;
    enviadoEm: string;
  };
};

const REVALIDAR = ["/portal/acompanhamento"];

export async function portalAcompanhamentoEnviarAction(
  _prev: PortalAcompanhamentoState,
  formData: FormData
): Promise<PortalAcompanhamentoState> {
  let session;
  try {
    session = await requirePortalSession();
  } catch (error) {
    return {
      erro:
        error instanceof Error
          ? error.message
          : "Sessão expirada. Faça login novamente.",
    };
  }

  if (session.role !== "funcionario" || !session.funcionario_id) {
    return { erro: "Acesso disponível apenas para funcionários." };
  }

  const supabase = await createSupabaseServerClient();
  const funcionarioId = session.funcionario_id;

  const obraId = String(formData.get("obraId") ?? "").trim();
  const etapa = String(formData.get("etapa") ?? "").trim();
  const etapaOutro = String(formData.get("etapaOutro") ?? "").trim();
  const observacaoFuncionario = String(formData.get("observacao") ?? "").trim();
  const dataAtualizacao = String(formData.get("dataAtualizacao") ?? "").trim();

  if (!obraId) return { erro: "Selecione a obra." };
  if (!dataAtualizacao) return { erro: "Informe a data da atualização." };
  if (!isEtapaObraValida(etapa)) return { erro: "Selecione a etapa da obra." };
  if (etapa === ETAPA_OUTRO && !etapaOutro) {
    return { erro: "Informe a etapa manualmente." };
  }

  const arquivos = formData
    .getAll("fotos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  let fotosValidadas;
  try {
    fotosValidadas = await lerFotosAcompanhamento(arquivos);
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : ACOMPANHAMENTO_MSG.semFotos,
    };
  }

  const autorizado = await funcionarioPodeEnviarNotaParaObra(
    supabase,
    funcionarioId,
    obraId
  );
  if (!autorizado) {
    return { erro: ACOMPANHAMENTO_MSG.obraNaoAutorizada };
  }

  const funcionario = await buscarFuncionarioPortalPorId(supabase, funcionarioId);
  if (!funcionario) {
    return { erro: "Funcionário não autorizado." };
  }

  const { data: obra } = await supabase
    .from("obras")
    .select("id, nome")
    .eq("id", obraId)
    .maybeSingle();

  if (!obra) {
    return { erro: "Obra não encontrada." };
  }

  try {
    const resultado = await salvarAcompanhamentoObra(supabase, {
      obraId,
      funcionarioId,
      authUserId: session.userId,
      etapa,
      etapaOutro: etapa === ETAPA_OUTRO ? etapaOutro : null,
      observacaoFuncionario: observacaoFuncionario || null,
      dataAtualizacao,
      fotos: fotosValidadas,
    });

    await auditarAcompanhamentoEnviado(session, {
      acompanhamentoId: resultado.acompanhamentoId,
      obraNome: obra.nome,
      funcionarioNome: funcionario.nome,
      totalFotos: resultado.totalFotos,
    });

    REVALIDAR.forEach((path) => revalidatePath(path));
    revalidatePath("/acompanhamento-obras");

    return {
      sucesso: {
        id: resultado.acompanhamentoId,
        obraNome: obra.nome,
        totalFotos: resultado.totalFotos,
        enviadoEm: resultado.criadoEm,
      },
    };
  } catch (error) {
    console.error("[portal/acompanhamento] enviar.erro", error);
    return {
      erro:
        error instanceof Error ? error.message : ACOMPANHAMENTO_MSG.erroGenerico,
    };
  }
}

export async function listarAcompanhamentosPortalAction(): Promise<
  AcompanhamentoResumo[]
> {
  const session = await requirePortalSession();
  if (!session.funcionario_id) return [];

  const supabase = await createSupabaseServerClient();
  return listarAcompanhamentosPortal(supabase, session.funcionario_id);
}

export async function obterUrlFotoAcompanhamentoPortalAction(
  storagePath: string
): Promise<{ url?: string; erro?: string }> {
  try {
    const session = await requirePortalSession();
    if (!session.funcionario_id) {
      return { erro: "Não autorizado." };
    }

    const supabase = await createSupabaseServerClient();

    const { data: foto } = await supabase
      .from("acompanhamento_obras_fotos")
      .select("acompanhamento_id, storage_path")
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (!foto) return { erro: "Arquivo não encontrado." };

    const detalhe = await obterAcompanhamentoPortal(
      supabase,
      foto.acompanhamento_id,
      session.funcionario_id
    );
    if (!detalhe) return { erro: "Não autorizado." };

    const { data, error } = await supabase.storage
      .from(ACOMPANHAMENTO_OBRAS_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      console.error("[portal/acompanhamento] signedUrl.erro", error?.message);
      return { erro: "Não foi possível carregar a imagem." };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error("[portal/acompanhamento] signedUrl", error);
    return { erro: "Não foi possível carregar a imagem." };
  }
}

export async function obterAcompanhamentoPortalAction(
  id: string
): Promise<AcompanhamentoDetalhe | null> {
  const session = await requirePortalSession();
  if (!session.funcionario_id) return null;

  const supabase = await createSupabaseServerClient();
  return obterAcompanhamentoPortal(supabase, id, session.funcionario_id);
}
