import { cache } from "react";
import { ADMIN_ROLE } from "@/lib/auth-constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/** Contagem para badge do menu — uma consulta por request, sem repetir auth. */
export const contarNotasPendentesParaLayout = cache(
  async (role: string | undefined): Promise<number> => {
    if (role !== ADMIN_ROLE) return 0;

    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("notas_fiscais")
      .select("*", { count: "exact", head: true })
      .in("status_processamento", ["pendente_aprovacao", "revisar"]);

    if (error) return 0;
    return count ?? 0;
  }
);
