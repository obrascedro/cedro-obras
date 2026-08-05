"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { parseNumber } from "@/lib/format";
import {
  buildStoragePath,
  NOTAS_FISCAIS_BUCKET,
} from "@/lib/notas-fiscais";
import { atualizarStatusNotaFiscalServer } from "@/lib/notas-fiscais-db-server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function uploadArquivoNotaAdminAction(
  formData: FormData
): Promise<{ storagePath: string } | { erro: string }> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const obraId = String(formData.get("obraId") ?? "").trim();
    const arquivo = formData.get("arquivo");

    if (!obraId || !(arquivo instanceof File)) {
      return { erro: "Obra e arquivo são obrigatórios." };
    }

    const storagePath = buildStoragePath(obraId, arquivo.name);
    const buffer = Buffer.from(await arquivo.arrayBuffer());

    const { error } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: arquivo.type || undefined,
      });

    if (error) return { erro: error.message };
    return { storagePath };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao enviar arquivo.",
    };
  }
}

export async function salvarNotaManualAdminAction(params: {
  obraId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  fornecedor: string;
  dataNota: string;
  valorInformado: string;
  observacoes: string;
}): Promise<{ ok: true } | { erro: string }> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("notas_fiscais").insert({
      obra_id: params.obraId,
      arquivo_path: params.storagePath,
      arquivo_nome: params.fileName,
      arquivo_tipo: params.mimeType,
      arquivo_tamanho: params.fileSize,
      fornecedor: params.fornecedor.trim() || null,
      data_nota: params.dataNota || null,
      valor_total: params.valorInformado
        ? parseNumber(params.valorInformado)
        : null,
      observacoes: params.observacoes.trim() || null,
      origem: "manual",
      status_processamento: "aguardando",
    });

    if (error) {
      await supabase.storage
        .from(NOTAS_FISCAIS_BUCKET)
        .remove([params.storagePath]);
      return { erro: error.message };
    }

    revalidatePath("/financeiro/notas-fiscais");
    return { ok: true };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao salvar nota.",
    };
  }
}

export async function criarNotaProcessandoAdminAction(params: {
  obraId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
}): Promise<{ notaId: string } | { erro: string }> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("notas_fiscais")
      .insert({
        obra_id: params.obraId,
        arquivo_path: params.storagePath,
        arquivo_nome: params.fileName,
        arquivo_tipo: params.mimeType,
        arquivo_tamanho: params.fileSize,
        origem: "ia",
        status_processamento: "processando",
      })
      .select("id")
      .single();

    if (error || !data) {
      return { erro: error?.message ?? "Erro ao registrar nota." };
    }

    revalidatePath("/financeiro/notas-fiscais");
    return { notaId: data.id };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao criar nota.",
    };
  }
}

export async function atualizarStatusNotaAdminAction(
  notaId: string,
  status: string
): Promise<{ ok: true } | { erro: string }> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();
    await atualizarStatusNotaFiscalServer(supabase, notaId, status);
    revalidatePath("/financeiro/notas-fiscais");
    return { ok: true };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao atualizar status.",
    };
  }
}

export async function obterUrlArquivoNotaAdminAction(
  arquivoPath: string
): Promise<{ url: string } | { erro: string }> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .createSignedUrl(arquivoPath, 3600);

    if (error || !data?.signedUrl) {
      return { erro: "Não foi possível abrir o arquivo." };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao abrir arquivo.",
    };
  }
}

export async function excluirNotaAdminAction(
  notaId: string,
  arquivoPath: string
): Promise<{ ok: true } | { erro: string }> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const { error: storageError } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .remove([arquivoPath]);

    if (storageError) return { erro: storageError.message };

    const { error: deleteError } = await supabase
      .from("notas_fiscais")
      .delete()
      .eq("id", notaId);

    if (deleteError) return { erro: deleteError.message };

    revalidatePath("/financeiro/notas-fiscais");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao excluir nota.",
    };
  }
}
