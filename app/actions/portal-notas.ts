"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { processarNotaFiscalComIA } from "@/lib/nota-fiscal-processar";
import {
  marcarNotaFiscalErroServer,
  atualizarStatusNotaFiscalServer,
} from "@/lib/notas-fiscais-db-server";
import { requirePortalSession } from "@/lib/auth";
import { auditarNotaEnviada } from "@/lib/audit-helpers";
import { buscarFuncionarioPortalPorId } from "@/lib/portal-notas/funcionarios";
import { verificarRateLimit, limparRateLimitMemoriaExpirado } from "@/lib/rate-limit-store";
import { PORTAL_NOTAS_RATE_LIMIT } from "@/lib/portal-notas/config";
import { salvarNotaPortalNoStorage } from "@/lib/portal-notas/salvar-nota";
import { lerBufferArquivoPortal } from "@/lib/portal-notas/validar-arquivo";
import { funcionarioPodeEnviarNotaParaObra } from "@/lib/portal-notas/obras-funcionario";

export type PortalNotasEnvioResultado = {
  ok: true;
  notaId: string;
  notaReferencia: string;
  obraNome: string;
  enviadoEm: string;
};

export type PortalNotasEnvioState = {
  erro?: string;
  sucesso?: PortalNotasEnvioResultado;
};

async function obterChaveRateLimit(userId?: string): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || hdrs.get("x-real-ip") || "local";
  return userId ? `${ip}:${userId}` : ip;
}

function formatarReferenciaNota(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function revalidarRotasPortalNotas() {
  revalidatePath("/portal/notas");
  revalidatePath("/portal/minhas-notas");
  revalidatePath("/financeiro/notas-fiscais");
  revalidatePath("/dashboard");
}

export async function portalNotasEnviarAction(
  _prev: PortalNotasEnvioState,
  formData: FormData
): Promise<PortalNotasEnvioState> {
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

  limparRateLimitMemoriaExpirado();
  const rate = await verificarRateLimit(
    `portal:envio:${await obterChaveRateLimit(session.userId)}`,
    PORTAL_NOTAS_RATE_LIMIT
  );
  if (!rate.permitido) {
    return {
      erro: `Limite de envios atingido. Aguarde ${rate.retryAfterSec ?? 60}s.`,
    };
  }

  const supabase = await createSupabaseServerClient();

  const funcionarioId = session.funcionario_id;
  let enviadoPorNome = session.nome;

  if (session.role === "funcionario") {
    if (!funcionarioId) {
      return { erro: "Perfil de funcionário incompleto." };
    }

    const funcionario = await buscarFuncionarioPortalPorId(
      supabase,
      funcionarioId
    );

    if (!funcionario) {
      return { erro: "Funcionário não autorizado." };
    }

    enviadoPorNome = funcionario.nome;
  } else if (!funcionarioId) {
    return {
      erro: "Envio pelo portal disponível apenas para funcionários.",
    };
  }

  const obraId = String(formData.get("obraId") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const arquivo = formData.get("arquivo");

  console.info("[portal-notas] envio.inicio", {
    userId: session.userId,
    funcionarioId,
    obraId,
    arquivoRecebido: arquivo instanceof File,
    tamanho: arquivo instanceof File ? arquivo.size : 0,
    tipo: arquivo instanceof File ? arquivo.type : null,
  });

  if (!obraId) {
    return { erro: "Selecione a obra." };
  }

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return {
      erro:
        "Não foi possível ler o arquivo enviado. Selecione a foto novamente e tente outra vez.",
    };
  }

  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select("id, nome")
    .eq("id", obraId)
    .maybeSingle();

  if (obraError || !obra) {
    return { erro: "Obra não encontrada." };
  }

  if (funcionarioId) {
    const autorizado = await funcionarioPodeEnviarNotaParaObra(
      supabase,
      funcionarioId,
      obraId
    );
    if (!autorizado) {
      return { erro: "Você não está autorizado a enviar notas para esta obra." };
    }
  }

  let arquivoValidado;
  try {
    arquivoValidado = await lerBufferArquivoPortal(arquivo);
  } catch (error) {
    console.error("[portal-notas] arquivo.invalido", {
      message: error instanceof Error ? error.message : "erro",
    });
    return {
      erro: error instanceof Error ? error.message : "Arquivo inválido.",
    };
  }

  let notaId: string | undefined;
  let storagePath: string | undefined;

  try {
    const salvo = await salvarNotaPortalNoStorage(supabase, {
      obraId,
      arquivo: arquivoValidado,
      enviadoPorNome,
      funcionarioId: funcionarioId!,
      authUserId: session.userId,
      observacoes: observacoes || undefined,
    });

    notaId = salvo.notaId;
    storagePath = salvo.storagePath;

    console.info("[portal-notas] storage.insert.ok", {
      notaId,
      tamanho: arquivoValidado.fileSize,
    });

    await atualizarStatusNotaFiscalServer(supabase, notaId, "processando");

    await processarNotaFiscalComIA(supabase, {
      storagePath,
      mimeType: arquivoValidado.mimeType,
      fileName: arquivoValidado.fileName,
      notaId,
      observacoes: observacoes || undefined,
      enviadoPorNome,
    });

    console.info("[portal-notas] ia.ok", { notaId });

    await auditarNotaEnviada(session, notaId);

    revalidarRotasPortalNotas();

    return {
      sucesso: {
        ok: true,
        notaId,
        notaReferencia: formatarReferenciaNota(notaId),
        obraNome: obra.nome,
        enviadoEm: salvo.criadoEm,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar a nota.";

    console.error("[portal-notas] envio.falhou", {
      notaId,
      message,
    });

    if (notaId) {
      await marcarNotaFiscalErroServer(supabase, notaId, message);
    }

    return { erro: message };
  }
}
