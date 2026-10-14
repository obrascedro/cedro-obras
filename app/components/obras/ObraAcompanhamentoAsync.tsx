import ObraAcompanhamentoSection from "@/app/components/ObraAcompanhamentoSection";
import { listarAcompanhamentosPorObra } from "@/lib/acompanhamento-obras/listar";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ObraAcompanhamentoAsyncProps = {
  obraId: string;
};

export default async function ObraAcompanhamentoAsync({
  obraId,
}: ObraAcompanhamentoAsyncProps) {
  const supabase = await createSupabaseServerClient();
  const itens = await listarAcompanhamentosPorObra(supabase, obraId).catch(
    () => []
  );

  return <ObraAcompanhamentoSection itens={itens} obraId={obraId} />;
}
