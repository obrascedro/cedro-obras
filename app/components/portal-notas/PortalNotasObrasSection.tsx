import PortalNotasApp from "@/app/components/portal-notas/PortalNotasApp";
import PortalWarningBanner from "@/app/components/portal-notas/PortalWarningBanner";
import { listarObrasAutorizadasFuncionario } from "@/lib/portal-notas/obras-funcionario";
import type { ObraOption } from "@/lib/notas-fiscais";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type PortalNotasObrasSectionProps = {
  funcionarioId: string;
};

export default async function PortalNotasObrasSection({
  funcionarioId,
}: PortalNotasObrasSectionProps) {
  const supabase = await createSupabaseServerClient();
  const { obras, codigoErro } = await listarObrasAutorizadasFuncionario(
    supabase,
    funcionarioId
  );

  if (codigoErro === "tabela_ausente") {
    console.error(
      "[portal] Tabela public.funcionario_obras ausente. Execute supabase/funcionario-obras.sql no Supabase."
    );
  }

  return (
    <>
      {obras.length === 0 ? (
        <PortalWarningBanner
          title="Nenhuma obra autorizada para envio."
          description="Peça ao administrador para vincular sua conta às obras corretas."
        />
      ) : null}
      <PortalNotasApp obras={obras as ObraOption[]} />
    </>
  );
}
