import AdminAuditoriaClient from "@/app/components/admin-auditoria/AdminAuditoriaClient";
import PageShell from "@/app/components/PageShell";
import {
  listarAcoesAuditoriaAction,
  listarAuditoriaAdminAction,
  listarUsuariosAuditoriaAction,
} from "@/app/actions/admin-auditoria";

export const dynamic = "force-dynamic";

export default async function AdminAuditoriaPage() {
  const [logs, usuarios, acoes] = await Promise.all([
    listarAuditoriaAdminAction(),
    listarUsuariosAuditoriaAction(),
    listarAcoesAuditoriaAction(),
  ]);

  return (
    <PageShell
      title="Auditoria"
      description="Histórico de atividades administrativas para rastreabilidade e segurança."
      maxWidth="full"
    >
      <AdminAuditoriaClient
        logsIniciais={logs}
        usuarios={usuarios}
        acoes={acoes}
      />
    </PageShell>
  );
}
