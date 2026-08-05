"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { processarNotaFiscalComIA } from "@/lib/nota-fiscal-processar";
import {
  marcarNotaFiscalErroServer,
  atualizarStatusNotaFiscalServer,
} from "@/lib/notas-fiscais-db-server";
import {
  assertPortalNotasConfigured,
  PORTAL_NOTAS_COOKIE,
  PORTAL_NOTAS_MSG,
} from "@/lib/portal-notas/config";
import { buscarFuncionarioPortalPorId } from "@/lib/portal-notas/funcionarios";
import {
  limparRateLimitExpirado,
  verificarRateLimitPortal,
} from "@/lib/portal-notas/rate-limit";
import { salvarNotaPortalNoStorage } from "@/lib/portal-notas/salvar-nota";
import {
  criarTokenSessaoPortal,
  exigirSessaoPortalNotas,
  opcoesCookiePortalNotas,
  validarSenhaPortal,
} from "@/lib/portal-notas/session";
import { lerBufferArquivoPortal } from "@/lib/portal-notas/validar-arquivo";

export type PortalNotasLoginState = {
  erro?: string;
};

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

async function obterChaveRateLimit(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || hdrs.get("x-real-ip") || "local";
  try {
    const sessao = await exigirSessaoPortalNotas();
    return `${ip}:${sessao.funcionarioId}`;
  } catch {
    return ip;
  }
}

function aplicarRateLimit(): void {
  limparRateLimitExpirado();
}

function formatarReferenciaNota(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export async function portalNotasLoginAction(
  _prev: PortalNotasLoginState,
  formData: FormData
): Promise<PortalNotasLoginState> {
  aplicarRateLimit();
  const rate = verificarRateLimitPortal(`login:${await obterChaveRateLimit()}`);
  if (!rate.permitido) {
    return {
      erro: `Muitas tentativas. Aguarde ${rate.retryAfterSec ?? 60} segundos.`,
    };
  }

  let secret: string;
  try {
    secret = assertPortalNotasConfigured();
  } catch (error) {
    return {
      erro:
        error instanceof Error
          ? error.message
          : "Portal indisponível no momento.",
    };
  }

  const funcionarioId = String(formData.get("funcionarioId") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!funcionarioId) {
    return { erro: PORTAL_NOTAS_MSG.funcionarioNaoAutorizado };
  }

  const supabase = createSupabaseServerClient();
  const funcionario = await buscarFuncionarioPortalPorId(
    supabase,
    funcionarioId
  );

  if (!funcionario) {
    return { erro: PORTAL_NOTAS_MSG.funcionarioNaoAutorizado };
  }

  if (!validarSenhaPortal(senha, secret)) {
    return { erro: PORTAL_NOTAS_MSG.senhaInvalida };
  }

  const token = criarTokenSessaoPortal(
    { funcionarioId: funcionario.id, nome: funcionario.nome },
    secret
  );
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_NOTAS_COOKIE, token, opcoesCookiePortalNotas());

  redirect("/portal/notas");
}

export async function portalNotasLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_NOTAS_COOKIE, "", {
    ...opcoesCookiePortalNotas(),
    maxAge: 0,
  });
  redirect("/portal/notas");
}

export async function portalNotasEnviarAction(
  _prev: PortalNotasEnvioState,
  formData: FormData
): Promise<PortalNotasEnvioState> {
  aplicarRateLimit();
  const rate = verificarRateLimitPortal(`envio:${await obterChaveRateLimit()}`);
  if (!rate.permitido) {
    return {
      erro: `Limite de envios atingido. Aguarde ${rate.retryAfterSec ?? 60}s.`,
    };
  }

  let sessao;
  try {
    sessao = await exigirSessaoPortalNotas();
  } catch {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const supabase = createSupabaseServerClient();
  const funcionario = await buscarFuncionarioPortalPorId(
    supabase,
    sessao.funcionarioId
  );

  if (!funcionario) {
    return { erro: "Sessão inválida. Faça login novamente." };
  }

  const obraId = String(formData.get("obraId") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const arquivo = formData.get("arquivo");

  if (!obraId) {
    return { erro: "Selecione a obra." };
  }

  if (!(arquivo instanceof File)) {
    return { erro: "Selecione ou tire uma foto da nota." };
  }

  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select("id, nome")
    .eq("id", obraId)
    .maybeSingle();

  if (obraError || !obra) {
    return { erro: "Obra não encontrada." };
  }

  let arquivoValidado;
  try {
    arquivoValidado = await lerBufferArquivoPortal(arquivo);
  } catch (error) {
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
      enviadoPorNome: funcionario.nome,
      funcionarioId: funcionario.id,
      observacoes: observacoes || undefined,
    });

    notaId = salvo.notaId;
    storagePath = salvo.storagePath;

    await atualizarStatusNotaFiscalServer(supabase, notaId, "processando");

    await processarNotaFiscalComIA(supabase, {
      storagePath,
      mimeType: arquivoValidado.mimeType,
      fileName: arquivoValidado.fileName,
      notaId,
      observacoes: observacoes || undefined,
      enviadoPorNome: funcionario.nome,
    });

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

    if (notaId) {
      await marcarNotaFiscalErroServer(supabase, notaId, message);
    }

    return { erro: message };
  }
}
