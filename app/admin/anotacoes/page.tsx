import AnotacoesClient from "@/app/components/anotacoes/AnotacoesClient";
import PageShell from "@/app/components/PageShell";
import { listarAnotacoesPessoaisAction } from "@/app/actions/anotacoes-pessoais";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAnotacoesPage() {
  await requireAdminSession();
  const anotacoes = await listarAnotacoesPessoaisAction();

  return (
    <PageShell
      title="Anotações"
      description="Registro pessoal de valores e observações — isolado de obras e financeiro."
      maxWidth="full"
    >
      <AnotacoesClient anotacoesIniciais={anotacoes} />
    </PageShell>
  );
}
