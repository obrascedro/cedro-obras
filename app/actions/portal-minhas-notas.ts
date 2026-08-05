"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requirePortalSession } from "@/lib/auth";
import { NOTAS_FISCAIS_BUCKET } from "@/lib/notas-fiscais";
import { obterNotaDoFuncionario } from "@/lib/portal-notas/minhas-notas";

export async function obterUrlArquivoNotaPortalAction(
  notaId: string
): Promise<{ url: string } | { erro: string }> {
  try {
    const session = await requirePortalSession();
    const supabase = await createSupabaseServerClient();
    const nota = await obterNotaDoFuncionario(supabase, session, notaId);

    if (!nota) {
      return { erro: "Nota não encontrada." };
    }

    const { data, error } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .createSignedUrl(nota.arquivo_path, 3600);

    if (error || !data?.signedUrl) {
      return { erro: "Não foi possível abrir o arquivo." };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o arquivo.",
    };
  }
}
