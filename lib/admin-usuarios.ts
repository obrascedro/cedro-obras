import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADMIN_ROLE,
  FUNCIONARIO_ROLE,
  type UserRole,
} from "@/lib/auth-constants";

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  criado_em: string;
  funcionario_id: string | null;
};

export function formatRoleLabel(role: UserRole): string {
  return role === ADMIN_ROLE ? "Administrador" : "Funcionário";
}

export async function listarUsuariosAdmin(
  admin: SupabaseClient
): Promise<UsuarioAdmin[]> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, nome, email, role, ativo, criado_em, funcionario_id")
    .order("nome");

  if (error) {
    console.error("[AdminUsuarios] listar.erro", error.message);
    return [];
  }

  const rows = (data ?? []) as UsuarioAdmin[];

  const semEmail = rows.filter((r) => !r.email?.trim());
  if (semEmail.length > 0) {
    await sincronizarEmailsAuth(admin, semEmail.map((r) => r.id));
    const { data: refreshed } = await admin
      .from("profiles")
      .select("id, nome, email, role, ativo, criado_em, funcionario_id")
      .order("nome");
    return (refreshed ?? []) as UsuarioAdmin[];
  }

  return rows;
}

async function sincronizarEmailsAuth(
  admin: SupabaseClient,
  userIds: string[]
): Promise<void> {
  for (const userId of userIds) {
    const { data } = await admin.auth.admin.getUserById(userId);
    const email = data.user?.email;
    if (email) {
      await admin.from("profiles").update({ email }).eq("id", userId);
    }
  }
}

export async function contarAdminsAtivos(
  admin: SupabaseClient,
  excluirId?: string
): Promise<number> {
  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", ADMIN_ROLE)
    .eq("ativo", true);

  if (excluirId) {
    query = query.neq("id", excluirId);
  }

  const { count, error } = await query;
  if (error) {
    console.error("[AdminUsuarios] contarAdmins.erro", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function assertPodeAlterarAdmin(
  admin: SupabaseClient,
  userId: string,
  params: {
    roleAtual: UserRole;
    novoRole?: UserRole;
    novoAtivo?: boolean;
  }
): Promise<void> {
  const desativaAdmin =
    params.roleAtual === ADMIN_ROLE &&
    (params.novoAtivo === false ||
      (params.novoRole && params.novoRole !== ADMIN_ROLE));

  if (!desativaAdmin) return;

  const outrosAdmins = await contarAdminsAtivos(admin, userId);
  if (outrosAdmins < 1) {
    throw new Error(
      "Não é possível remover ou desativar o último administrador do sistema."
    );
  }
}

export async function vincularPortalFuncionario(
  admin: SupabaseClient,
  userId: string,
  nome: string
): Promise<string | null> {
  const nomeTrim = nome.trim();
  if (!nomeTrim) return null;

  const { data: existente } = await admin
    .from("portal_funcionarios")
    .select("id")
    .ilike("nome", nomeTrim)
    .maybeSingle();

  let funcionarioId = existente?.id as string | undefined;

  if (!funcionarioId) {
    const { data: criado, error } = await admin
      .from("portal_funcionarios")
      .insert({ nome: nomeTrim, ativo: true })
      .select("id")
      .single();

    if (error) {
      const { data: retry } = await admin
        .from("portal_funcionarios")
        .select("id")
        .ilike("nome", nomeTrim)
        .maybeSingle();
      funcionarioId = retry?.id as string | undefined;
    } else {
      funcionarioId = criado?.id as string;
    }
  }

  if (funcionarioId) {
    await admin
      .from("profiles")
      .update({ funcionario_id: funcionarioId })
      .eq("id", userId);

    await admin
      .from("portal_funcionarios")
      .update({ ativo: true })
      .eq("id", funcionarioId);
  }

  return funcionarioId ?? null;
}

export async function obterUsuarioAdmin(
  admin: SupabaseClient,
  userId: string
): Promise<UsuarioAdmin | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, nome, email, role, ativo, criado_em, funcionario_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UsuarioAdmin;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validarRole(role: string): role is UserRole {
  return role === ADMIN_ROLE || role === FUNCIONARIO_ROLE;
}

export async function upsertProfileAdmin(
  admin: SupabaseClient,
  params: {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
    ativo: boolean;
    funcionario_id?: string | null;
  }
): Promise<void> {
  const { error } = await admin.from("profiles").upsert(
    {
      id: params.id,
      nome: params.nome.trim(),
      email: normalizarEmail(params.email),
      role: params.role,
      ativo: params.ativo,
      funcionario_id: params.funcionario_id ?? null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function sincronizarAuthMetadata(
  admin: SupabaseClient,
  userId: string,
  params: { nome: string; role: UserRole }
): Promise<void> {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { nome: params.nome.trim() },
    app_metadata: { role: params.role },
  });

  if (error) {
    throw new Error(error.message);
  }
}
