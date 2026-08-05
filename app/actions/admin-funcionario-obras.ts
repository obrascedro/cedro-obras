"use server";

import { revalidatePath } from "next/cache";
import {
  listarObrasAutorizadasIdsAdmin,
  listarObrasDisponiveisAdmin,
  nomesObrasPorIdsAdmin,
  salvarObrasAutorizadasAdmin,
  type ObraAdminOption,
} from "@/lib/admin-funcionario-obras";
import { obterUsuarioAdmin } from "@/lib/admin-usuarios";
import { auditarFuncionarioObras } from "@/lib/audit-helpers";
import { requireAdminSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AdminFuncionariosState } from "@/app/actions/admin-funcionarios";

const REVALIDAR = ["/admin/funcionarios", "/portal/notas"];

export async function listarObrasDisponiveisAdminAction(): Promise<
  ObraAdminOption[]
> {
  await requireAdminSession();
  const admin = createSupabaseAdminClient();
  return listarObrasDisponiveisAdmin(admin);
}

export async function listarObrasAutorizadasFuncionarioAdminAction(
  funcionarioId: string
): Promise<string[]> {
  await requireAdminSession();
  if (!funcionarioId) return [];

  const admin = createSupabaseAdminClient();
  return listarObrasAutorizadasIdsAdmin(admin, funcionarioId);
}

export async function salvarObrasAutorizadasFuncionarioAdminAction(
  _prev: AdminFuncionariosState,
  formData: FormData
): Promise<AdminFuncionariosState> {
  try {
    const session = await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const userId = String(formData.get("userId") ?? "").trim();
    const funcionarioId = String(formData.get("funcionarioId") ?? "").trim();
    const obraIds = formData
      .getAll("obraIds")
      .map((v) => String(v).trim())
      .filter(Boolean);
    const confirmarRemocaoTotal =
      formData.get("confirmarRemocaoTotal") === "true";

    if (!userId || !funcionarioId) {
      return { erro: "Funcionário não identificado." };
    }

    const usuario = await obterUsuarioAdmin(admin, userId);
    if (!usuario) {
      return { erro: "Usuário não encontrado." };
    }

    if (usuario.funcionario_id !== funcionarioId) {
      return { erro: "Vínculo de funcionário inválido." };
    }

    const autorizadasAtuais = await listarObrasAutorizadasIdsAdmin(
      admin,
      funcionarioId
    );

    if (autorizadasAtuais.length > 0 && obraIds.length === 0) {
      if (!confirmarRemocaoTotal) {
        return {
          erro:
            "Confirme a remoção de todos os acessos às obras antes de salvar.",
        };
      }
    }

    const resultado = await salvarObrasAutorizadasAdmin(
      admin,
      funcionarioId,
      obraIds
    );

    const idsAuditoria = [
      ...resultado.adicionadas,
      ...resultado.reativadas,
      ...resultado.removidas,
    ];
    const nomesMap = await nomesObrasPorIdsAdmin(admin, idsAuditoria);

    await auditarFuncionarioObras(session, {
      funcionarioNome: usuario.nome,
      funcionarioId,
      userId,
      adicionadas: resultado.adicionadas.map(
        (id) => nomesMap.get(id) ?? id.slice(0, 8)
      ),
      reativadas: resultado.reativadas.map(
        (id) => nomesMap.get(id) ?? id.slice(0, 8)
      ),
      removidas: resultado.removidas.map(
        (id) => nomesMap.get(id) ?? id.slice(0, 8)
      ),
    });

    REVALIDAR.forEach((path) => revalidatePath(path));

    const total = obraIds.length;
    return {
      sucesso:
        total === 0
          ? "Todos os acessos às obras foram removidos."
          : `Obras autorizadas atualizadas (${total} obra${total === 1 ? "" : "s"}).`,
    };
  } catch (error) {
    return {
      erro:
        error instanceof Error
          ? error.message
          : "Erro ao salvar obras autorizadas.",
    };
  }
}
