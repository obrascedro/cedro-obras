"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_ROLE, FUNCIONARIO_ROLE, requireAdminSession } from "@/lib/auth";
import {
  assertPodeAlterarAdmin,
  listarUsuariosAdmin,
  normalizarEmail,
  obterUsuarioAdmin,
  sincronizarAuthMetadata,
  upsertProfileAdmin,
  validarRole,
  vincularPortalFuncionario,
  type UsuarioAdmin,
} from "@/lib/admin-usuarios";
import { auditarFuncionario } from "@/lib/audit-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type AdminFuncionariosState = {
  erro?: string;
  sucesso?: string;
};

const REVALIDAR = ["/admin/funcionarios"];

export async function listarFuncionariosAdminAction(): Promise<UsuarioAdmin[]> {
  await requireAdminSession();
  const admin = createSupabaseAdminClient();
  return listarUsuariosAdmin(admin);
}

export async function criarFuncionarioAdminAction(
  _prev: AdminFuncionariosState,
  formData: FormData
): Promise<AdminFuncionariosState> {
  try {
    const session = await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = normalizarEmail(String(formData.get("email") ?? ""));
    const senha = String(formData.get("senha") ?? "");
    const roleRaw = String(formData.get("role") ?? "");

    if (!nome || !email || !senha) {
      return { erro: "Preencha nome, e-mail e senha temporária." };
    }

    if (senha.length < 8) {
      return { erro: "A senha temporária deve ter pelo menos 8 caracteres." };
    }

    if (!validarRole(roleRaw)) {
      return { erro: "Perfil inválido." };
    }

    const { data: criado, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
        app_metadata: { role: roleRaw },
      });

    if (createError || !criado.user) {
      return {
        erro:
          createError?.message.includes("already") ||
          createError?.message.includes("registered")
            ? "Este e-mail já está cadastrado."
            : createError?.message ?? "Erro ao criar usuário.",
      };
    }

    const userId = criado.user.id;

    await upsertProfileAdmin(admin, {
      id: userId,
      nome,
      email,
      role: roleRaw,
      ativo: true,
    });

    if (roleRaw === FUNCIONARIO_ROLE) {
      await vincularPortalFuncionario(admin, userId, nome);
    }

    await auditarFuncionario(session, {
      acao: "criacao",
      descricao: `${session.nome} criou o funcionário ${nome}`,
      registro_id: userId,
    });

    REVALIDAR.forEach((path) => revalidatePath(path));
    return { sucesso: `Usuário ${nome} criado com sucesso.` };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao criar funcionário.",
    };
  }
}

export async function atualizarFuncionarioAdminAction(
  _prev: AdminFuncionariosState,
  formData: FormData
): Promise<AdminFuncionariosState> {
  try {
    const session = await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const userId = String(formData.get("userId") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    const email = normalizarEmail(String(formData.get("email") ?? ""));
    const roleRaw = String(formData.get("role") ?? "");
    const ativo = formData.get("ativo") === "true";

    if (!userId || !nome || !email) {
      return { erro: "Dados incompletos." };
    }

    if (!validarRole(roleRaw)) {
      return { erro: "Perfil inválido." };
    }

    const atual = await obterUsuarioAdmin(admin, userId);
    if (!atual) {
      return { erro: "Usuário não encontrado." };
    }

    await assertPodeAlterarAdmin(admin, userId, {
      roleAtual: atual.role,
      novoRole: roleRaw,
      novoAtivo: ativo,
    });

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { nome },
      app_metadata: { role: roleRaw },
    });

    if (authError) {
      return { erro: authError.message };
    }

    let funcionarioId = atual.funcionario_id;

    if (roleRaw === FUNCIONARIO_ROLE) {
      funcionarioId = await vincularPortalFuncionario(admin, userId, nome);
    } else if (roleRaw === ADMIN_ROLE) {
      funcionarioId = null;
    }

    await upsertProfileAdmin(admin, {
      id: userId,
      nome,
      email,
      role: roleRaw,
      ativo,
      funcionario_id: funcionarioId,
    });

    await sincronizarAuthMetadata(admin, userId, { nome, role: roleRaw });

    if (roleRaw === FUNCIONARIO_ROLE && !ativo && funcionarioId) {
      await admin
        .from("portal_funcionarios")
        .update({ ativo: false })
        .eq("id", funcionarioId);
    }

    await auditarFuncionario(session, {
      acao: "edicao",
      descricao: `${session.nome} editou o funcionário ${nome}`,
      registro_id: userId,
    });

    if (email !== atual.email) {
      await auditarFuncionario(session, {
        acao: "alteracao_email",
        descricao: `${session.nome} alterou o e-mail de ${atual.nome}`,
        registro_id: userId,
      });
    }

    if (roleRaw !== atual.role) {
      await auditarFuncionario(session, {
        acao: "alteracao_perfil",
        descricao: `${session.nome} alterou o perfil de ${atual.nome}`,
        registro_id: userId,
      });
    }

    if (ativo !== atual.ativo) {
      await auditarFuncionario(session, {
        acao: ativo ? "ativacao" : "desativacao",
        descricao: ativo
          ? `${session.nome} ativou ${atual.nome}`
          : `${session.nome} desativou ${atual.nome}`,
        registro_id: userId,
      });
    }

    REVALIDAR.forEach((path) => revalidatePath(path));
    return { sucesso: "Usuário atualizado." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao atualizar usuário.",
    };
  }
}

export async function redefinirSenhaFuncionarioAdminAction(
  _prev: AdminFuncionariosState,
  formData: FormData
): Promise<AdminFuncionariosState> {
  try {
    const session = await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const userId = String(formData.get("userId") ?? "").trim();
    const senha = String(formData.get("senha") ?? "");

    if (!userId || !senha) {
      return { erro: "Informe a nova senha." };
    }

    if (senha.length < 8) {
      return { erro: "A senha deve ter pelo menos 8 caracteres." };
    }

    const alvo = await obterUsuarioAdmin(admin, userId);
    if (!alvo) {
      return { erro: "Usuário não encontrado." };
    }

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: senha,
    });

    if (error) {
      return { erro: error.message };
    }

    await auditarFuncionario(session, {
      acao: "redefinicao_senha",
      descricao: `${session.nome} redefiniu a senha de ${alvo.nome}`,
      registro_id: userId,
    });

    return { sucesso: "Senha redefinida com sucesso." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao redefinir senha.",
    };
  }
}

export async function alternarAtivoFuncionarioAdminAction(
  userId: string
): Promise<AdminFuncionariosState> {
  try {
    const session = await requireAdminSession();
    const admin = createSupabaseAdminClient();

    const atual = await obterUsuarioAdmin(admin, userId);
    if (!atual) {
      return { erro: "Usuário não encontrado." };
    }

    const novoAtivo = !atual.ativo;

    await assertPodeAlterarAdmin(admin, userId, {
      roleAtual: atual.role,
      novoAtivo,
    });

    await admin
      .from("profiles")
      .update({ ativo: novoAtivo })
      .eq("id", userId);

    if (atual.funcionario_id) {
      await admin
        .from("portal_funcionarios")
        .update({ ativo: novoAtivo })
        .eq("id", atual.funcionario_id);
    }

    await auditarFuncionario(session, {
      acao: novoAtivo ? "ativacao" : "desativacao",
      descricao: novoAtivo
        ? `${session.nome} ativou ${atual.nome}`
        : `${session.nome} desativou ${atual.nome}`,
      registro_id: userId,
    });

    REVALIDAR.forEach((path) => revalidatePath(path));
    return {
      sucesso: novoAtivo ? "Usuário ativado." : "Usuário desativado.",
    };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao alterar status.",
    };
  }
}
