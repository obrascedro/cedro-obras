import { listarClientesObraAdminAction } from "@/app/actions/obras-admin";
import ObraDetalheResumo, {
  type ObraResumoUi,
} from "@/app/components/obras/ObraDetalheResumo";

type ObraDetalheResumoLoaderProps = {
  isAdmin: boolean;
  statusBadgeClass: string;
  obra: ObraResumoUi;
};

export default async function ObraDetalheResumoLoader({
  isAdmin,
  statusBadgeClass,
  obra,
}: ObraDetalheResumoLoaderProps) {
  const clientes = isAdmin
    ? await listarClientesObraAdminAction().catch(() => [])
    : [];

  return (
    <ObraDetalheResumo
      isAdmin={isAdmin}
      clientes={clientes}
      statusBadgeClass={statusBadgeClass}
      obra={obra}
    />
  );
}
