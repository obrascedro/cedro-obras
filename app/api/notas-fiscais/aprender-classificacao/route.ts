import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth-api";
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
  const denied = await assertAdminApi();
  if (denied) return denied;

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

    const supabase = await createSupabaseServerClient();
    await salvarClassificacaoAprendida(descricao, categoria, etapa, supabase);

    logNotaFiscal("aprendizado.api.sucesso", {
      descricao: descricao.slice(0, 80),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logNotaFiscalError("aprendizado.api.erro", error);

    return NextResponse.json(
      { error: "Não foi possível salvar a classificação." },
      { status: 500 }
    );
  }
}
