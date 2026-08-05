import type { SupabaseClient } from "@supabase/supabase-js";
import { somarGastosObra } from "@/lib/gastos-obra";
import { somarRecebimentosObra } from "@/lib/obra-recebimentos";

/**
 * Sincroniza campos derivados em `obras` (valor_recebido, gasto_realizado, lucro_estimado).
 * Fonte de verdade: soma de `obra_recebimentos` e `gastos_obra` (ativos).
 * Os campos em `obras` são cache legado — a UI deve usar sempre as somas calculadas.
 */
export async function sincronizarFinanceiroObra(
  obraId: string,
  client: SupabaseClient
): Promise<{
  valorRecebido: number;
  gastoRealizado: number;
  lucroEstimado: number;
}> {
  const [gastoRealizado, valorRecebido] = await Promise.all([
    somarGastosObra(client, obraId),
    somarRecebimentosObra(client, obraId),
  ]);
  const lucroEstimado = valorRecebido - gastoRealizado;

  const { error: updateError } = await client
    .from("obras")
    .update({
      valor_recebido: valorRecebido,
      gasto_realizado: gastoRealizado,
      lucro_estimado: lucroEstimado,
    })
    .eq("id", obraId);

  if (updateError) throw updateError;

  return { valorRecebido, gastoRealizado, lucroEstimado };
}

/** @deprecated Use sincronizarFinanceiroObra */
export async function recalcularFinanceiroObra(
  obraId: string,
  client: SupabaseClient
) {
  const result = await sincronizarFinanceiroObra(obraId, client);
  return {
    gastoRealizado: result.gastoRealizado,
    lucroEstimado: result.lucroEstimado,
  };
}

export async function recalcularGastoRealizado(
  obraId: string,
  client: SupabaseClient
) {
  const { gastoRealizado } = await sincronizarFinanceiroObra(obraId, client);
  return gastoRealizado;
}
