import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { processarNotaFiscalComIA } from "@/lib/nota-fiscal-processar";
import { logNotaFiscalError } from "@/lib/nota-fiscal-log";
import { marcarNotaFiscalErroServer } from "@/lib/notas-fiscais-db-server";

export const runtime = "nodejs";

type LerNotaBody = {
  storagePath: string;
  mimeType: string;
  fileName: string;
  notaId: string;
  observacoes?: string;
  enviadoPorNome?: string;
};

export async function POST(request: Request) {
  let notaId: string | undefined;

  try {
    const body = (await request.json()) as LerNotaBody;
    const { storagePath, mimeType, fileName, observacoes, enviadoPorNome } = body;
    notaId = body.notaId;

    if (!storagePath || !mimeType || !fileName || !notaId) {
      return NextResponse.json(
        {
          error:
            "storagePath, mimeType, fileName e notaId são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { leitura, alertas } = await processarNotaFiscalComIA(supabase, {
      storagePath,
      mimeType,
      fileName,
      notaId,
      observacoes,
      enviadoPorNome,
    });

    return NextResponse.json({ leitura, alertas });
  } catch (error) {
    logNotaFiscalError("api.ler.erro", error, { notaId });

    const message =
      error instanceof Error
        ? error.message
        : "Erro ao processar a nota fiscal com IA.";

    if (notaId) {
      const supabase = createSupabaseServerClient();
      await marcarNotaFiscalErroServer(supabase, notaId, message);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
