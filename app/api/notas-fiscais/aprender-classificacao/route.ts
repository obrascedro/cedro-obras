import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import { salvarClassificacaoAprendida } from "@/lib/nota-fiscal-classificacao-aprendida";

export const runtime = "nodejs";

type AprenderBody = {
  descricao: string;
  categoria: string;
  etapa: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AprenderBody;
    const { descricao, categoria, etapa } = body;

    if (!descricao?.trim() || !categoria?.trim() || !etapa?.trim()) {
      return NextResponse.json(
        { error: "descricao, categoria e etapa são obrigatórios." },
        { status: 400 }
      );
    }

    logNotaFiscal("aprendizado.api.inicio", {
      descricao: descricao.slice(0, 80),
      categoria,
      etapa,
    });

    const supabase = createSupabaseServerClient();
    await salvarClassificacaoAprendida(descricao, categoria, etapa, supabase);

    logNotaFiscal("aprendizado.api.sucesso", {
      descricao: descricao.slice(0, 80),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logNotaFiscalError("aprendizado.api.erro", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro ao salvar classificação aprendida.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
