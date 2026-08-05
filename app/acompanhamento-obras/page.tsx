import AdminAcompanhamentoClient from "@/app/components/admin-acompanhamento/AdminAcompanhamentoClient";
import PageShell from "@/app/components/PageShell";
import {
  listarAcompanhamentosAdminAction,
  listarObrasEFuncionariosAdminAction,
} from "@/app/actions/admin-acompanhamento";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ obra?: string }>;
};

export default async function AcompanhamentoObrasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const obraInicial = params.obra?.trim() ?? "";

  const [inicial, opcoes] = await Promise.all([
    listarAcompanhamentosAdminAction(
      obraInicial ? { obraId: obraInicial } : {}
    ),
    listarObrasEFuncionariosAdminAction(),
  ]);

  return (
    <PageShell
      title="Acompanhamento de Obras"
      description="Fotos e atualizações enviadas pelos funcionários em campo."
      maxWidth="full"
    >
      <AdminAcompanhamentoClient
        inicial={inicial}
        obras={opcoes.obras}
        funcionarios={opcoes.funcionarios}
        obraInicial={obraInicial}
      />
    </PageShell>
  );
}
