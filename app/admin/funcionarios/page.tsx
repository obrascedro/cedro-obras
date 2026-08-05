import AdminFuncionariosClient from "@/app/components/admin-funcionarios/AdminFuncionariosClient";
import PageShell from "@/app/components/PageShell";
import { listarFuncionariosAdminAction } from "@/app/actions/admin-funcionarios";
import { assertSupabaseAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminFuncionariosPage() {
  let configOk = true;
  let configErro = "";

  try {
    assertSupabaseAdminConfigured();
  } catch (error) {
    configOk = false;
    configErro =
      error instanceof Error
        ? error.message
        : "Configure SUPABASE_SERVICE_ROLE_KEY.";
  }

  const usuarios = configOk ? await listarFuncionariosAdminAction() : [];

  return (
    <PageShell
      title="Funcionários"
      description="Cadastro dinâmico de usuários, perfis e acessos."
      maxWidth="full"
    >
      {!configOk ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {configErro}
        </p>
      ) : null}
      <AdminFuncionariosClient usuarios={usuarios} />
    </PageShell>
  );
}
