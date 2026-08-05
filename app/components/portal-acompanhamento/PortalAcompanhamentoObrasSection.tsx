import PortalAcompanhamentoApp from "@/app/components/portal-acompanhamento/PortalAcompanhamentoApp";
import PortalWarningBanner from "@/app/components/portal-notas/PortalWarningBanner";
import { listarObrasAutorizadasFuncionario } from "@/lib/portal-notas/obras-funcionario";
import type { ObraOption } from "@/lib/notas-fiscais";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type PortalAcompanhamentoObrasSectionProps = {
  funcionarioId: string;
};

export default async function PortalAcompanhamentoObrasSection({
  funcionarioId,
}: PortalAcompanhamentoObrasSectionProps) {
  const supabase = await createSupabaseServerClient();
  const { obras, codigoErro } = await listarObrasAutorizadasFuncionario(
    supabase,
    funcionarioId
  );

  if (codigoErro === "tabela_ausente") {
    console.error(
      "[portal/acompanhamento] Tabela funcionario_obras ausente."
    );
  }

  return (
    <>
      {obras.length === 0 ? (
        <PortalWarningBanner
          title="Nenhuma obra autorizada."
          description="Peça ao administrador para vincular sua conta às obras corretas."
        />
      ) : null}
      <PortalAcompanhamentoApp obras={obras as ObraOption[]} />
    </>
  );
}
