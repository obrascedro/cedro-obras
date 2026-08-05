import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function recalcularFinanceiroObra(
  obraId: string,
  client: SupabaseClient = supabase
) {
  const { data: gastos, error: fetchGastosError } = await client
    .from("gastos_obra")
    .select("valor_total")
    .eq("obra_id", obraId);

  if (fetchGastosError) {
    throw fetchGastosError;
  }

  const gastoRealizado = (gastos ?? []).reduce(
    (sum, gasto) => sum + (gasto.valor_total ?? 0),
    0
  );

  const { data: obra, error: fetchObraError } = await client
    .from("obras")
    .select("valor_recebido")
    .eq("id", obraId)
    .single();

  if (fetchObraError) {
    throw fetchObraError;
  }

  const lucroEstimado = (obra?.valor_recebido ?? 0) - gastoRealizado;

  const { error: updateError } = await client
    .from("obras")
    .update({
      gasto_realizado: gastoRealizado,
      lucro_estimado: lucroEstimado,
    })
    .eq("id", obraId);

  if (updateError) {
    throw updateError;
  }

  return { gastoRealizado, lucroEstimado };
}

export async function recalcularGastoRealizado(obraId: string) {
  const { gastoRealizado } = await recalcularFinanceiroObra(obraId);
  return gastoRealizado;
}
