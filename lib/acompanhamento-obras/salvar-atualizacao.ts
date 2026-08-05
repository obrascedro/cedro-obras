import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACOMPANHAMENTO_OBRAS_BUCKET,
} from "@/lib/acompanhamento-obras/config";
import { buildAcompanhamentoStoragePath } from "@/lib/acompanhamento-obras/storage-path";
import type { FotoAcompanhamentoValidada } from "@/lib/acompanhamento-obras/validar-fotos";

export type SalvarAcompanhamentoParams = {
  obraId: string;
  funcionarioId: string;
  authUserId: string;
  etapa: string;
  etapaOutro?: string | null;
  observacaoFuncionario?: string | null;
  dataAtualizacao: string;
  fotos: FotoAcompanhamentoValidada[];
};

export type SalvarAcompanhamentoResultado = {
  acompanhamentoId: string;
  criadoEm: string;
  totalFotos: number;
};

async function removerArquivosStorage(
  supabase: SupabaseClient,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(ACOMPANHAMENTO_OBRAS_BUCKET).remove(paths);
}

export async function salvarAcompanhamentoObra(
  supabase: SupabaseClient,
  params: SalvarAcompanhamentoParams
): Promise<SalvarAcompanhamentoResultado> {
  const obsFunc = params.observacaoFuncionario?.trim() || null;

  const { data: registro, error: insertError } = await supabase
    .from("acompanhamento_obras")
    .insert({
      obra_id: params.obraId,
      funcionario_id: params.funcionarioId,
      auth_user_id: params.authUserId,
      etapa: params.etapa,
      etapa_outro: params.etapaOutro?.trim() || null,
      observacao: obsFunc,
      observacao_funcionario: obsFunc,
      data_atualizacao: params.dataAtualizacao,
      ativo: true,
    })
    .select("id, criado_em")
    .single();

  if (insertError || !registro) {
    console.error("[acompanhamento] insert.erro", insertError?.message);
    throw new Error("Não foi possível registrar a atualização.");
  }

  const acompanhamentoId = String(registro.id);
  const pathsEnviados: string[] = [];
  const fotosInseridas: { path: string; foto: FotoAcompanhamentoValidada }[] =
    [];

  try {
    for (const foto of params.fotos) {
      const storagePath = buildAcompanhamentoStoragePath(
        params.obraId,
        acompanhamentoId,
        foto.fileName
      );

      const { error: uploadError } = await supabase.storage
        .from(ACOMPANHAMENTO_OBRAS_BUCKET)
        .upload(storagePath, foto.buffer, {
          contentType: foto.mimeType,
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("[acompanhamento] upload.erro", uploadError.message);
        throw new Error("Não foi possível enviar as fotos. Tente novamente.");
      }

      pathsEnviados.push(storagePath);
      fotosInseridas.push({ path: storagePath, foto });
    }

    if (fotosInseridas.length > 0) {
      const { error: fotosError } = await supabase
        .from("acompanhamento_obras_fotos")
        .insert(
          fotosInseridas.map(({ path, foto }) => ({
            acompanhamento_id: acompanhamentoId,
            storage_path: path,
            nome_original: foto.nomeOriginal,
            mime_type: foto.mimeType,
            tamanho_bytes: foto.fileSize,
          }))
        );

      if (fotosError) {
        console.error("[acompanhamento] fotos.insert.erro", fotosError.message);
        throw new Error("Não foi possível salvar as fotos. Tente novamente.");
      }
    }

    return {
      acompanhamentoId,
      criadoEm: String(registro.criado_em),
      totalFotos: fotosInseridas.length,
    };
  } catch (error) {
    await removerArquivosStorage(supabase, pathsEnviados);
    await supabase
      .from("acompanhamento_obras")
      .delete()
      .eq("id", acompanhamentoId);
    throw error;
  }
}
