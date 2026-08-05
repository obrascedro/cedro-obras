import { notFound, redirect } from "next/navigation";
import MinhasNotasDetalhe from "@/app/components/portal-notas/MinhasNotasDetalhe";
import PortalPageLayout from "@/app/components/portal-notas/PortalPageLayout";
import { getAppSession, LOGIN_PATH } from "@/lib/auth";
import { obterNotaDoFuncionario } from "@/lib/portal-notas/minhas-notas";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type MinhasNotasDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function MinhasNotasDetalhePage({
  params,
}: MinhasNotasDetalhePageProps) {
  const session = await getAppSession();

  if (!session) {
    redirect(LOGIN_PATH);
  }

  if (session.role === "funcionario" && !session.funcionario_id) {
    redirect(LOGIN_PATH);
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const nota = await obterNotaDoFuncionario(supabase, session, id);

  if (!nota) {
    notFound();
  }

  return (
    <PortalPageLayout
      nomeFuncionario={session.nome}
      activePath="/portal/minhas-notas"
    >
      <MinhasNotasDetalhe nota={nota} />
    </PortalPageLayout>
  );
}
