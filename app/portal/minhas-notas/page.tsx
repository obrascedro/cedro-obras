import { redirect } from "next/navigation";
import MinhasNotasLista from "@/app/components/portal-notas/MinhasNotasLista";
import PortalPageLayout from "@/app/components/portal-notas/PortalPageLayout";
import { getAppSession, LOGIN_PATH } from "@/lib/auth";
import { listarNotasDoFuncionario } from "@/lib/portal-notas/minhas-notas";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function MinhasNotasPage() {
  const session = await getAppSession();

  if (!session) {
    redirect(LOGIN_PATH);
  }

  if (session.role === "funcionario" && !session.funcionario_id) {
    redirect(LOGIN_PATH);
  }

  const supabase = await createSupabaseServerClient();
  const notas = await listarNotasDoFuncionario(supabase, session);

  return (
    <PortalPageLayout
      nomeFuncionario={session.nome}
      activePath="/portal/minhas-notas"
    >
      <MinhasNotasLista notas={notas} />
    </PortalPageLayout>
  );
}
