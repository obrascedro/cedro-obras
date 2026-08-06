import type { SupabaseClient } from "@supabase/supabase-js";
import { obterStatsDashboardAcompanhamento } from "@/lib/acompanhamento-obras/listar";
import { agruparGastosPorEtapaDetalhado } from "@/lib/gastos-etapa";
import {
  agruparPorCampo,
  buildUltimoGastoPorObra,
  calcularLucro,
  gerarAlertasDashboard,
  type GastoDashboard,
  type GastoRecente,
  type ObraDashboard,
} from "@/lib/dashboard";

export type DashboardData = {
  obrasLista: ObraDashboard[];
  gastosLista: GastoDashboard[];
  movimentacoes: GastoRecente[];
  notasFiscais: Array<{
    status_processamento: string;
    valor_total: number | null;
    itens_json?: unknown;
  }>;
  statsAcompanhamento: Awaited<
    ReturnType<typeof obterStatsDashboardAcompanhamento>
  >;
  errors: {
    obras?: string;
    gastos?: string;
    gastosRecentes?: string;
    notas?: string;
  };
  metricas: {
    valorContratado: number;
    totalRecebido: number;
    gastoRealizado: number;
    lucroEstimado: number;
    totalObras: number;
    obrasEmAndamento: number;
    obrasConcluidas: number;
  };
  gastosPorEtapa: ReturnType<typeof agruparGastosPorEtapaDetalhado>;
  gastosPorCategoria: ReturnType<typeof agruparPorCampo>;
  alertas: ReturnType<typeof gerarAlertasDashboard>;
  obraFiltrada: boolean;
};

const OBRA_SELECT =
  "id, nome, status, orcamento_previsto, valor_recebido, gasto_realizado, lucro_estimado, data_previsao_termino, clientes(nome)";

export async function carregarDashboardData(
  supabase: SupabaseClient,
  obraId: string | null
): Promise<DashboardData> {
  const obraFiltrada = Boolean(obraId);

  let obrasQuery = supabase
    .from("obras")
    .select(OBRA_SELECT)
    .order("data_inicio", { ascending: false });

  if (obraId) {
    obrasQuery = obrasQuery.eq("id", obraId);
  }

  let gastosQuery = supabase
    .from("gastos_obra")
    .select("obra_id, etapa, categoria, valor_total, data_gasto, criado_em")
    .order("criado_em", { ascending: false })
    .limit(obraId ? 5000 : 2000);

  if (obraId) {
    gastosQuery = gastosQuery.eq("obra_id", obraId);
  }

  let gastosRecentesQuery = supabase
    .from("gastos_obra")
    .select("id, data_gasto, descricao, etapa, valor_total, obra_id, obras(nome)")
    .order("data_gasto", { ascending: false })
    .limit(10);

  if (obraId) {
    gastosRecentesQuery = gastosRecentesQuery.eq("obra_id", obraId);
  }

  let notasQuery = supabase
    .from("notas_fiscais")
    .select("status_processamento, valor_total, itens_json")
    .order("criado_em", { ascending: false })
    .limit(500);

  if (obraId) {
    notasQuery = notasQuery.eq("obra_id", obraId);
  }

  const [
    { data: obras, error: obrasError },
    { data: gastos, error: gastosError },
    { data: gastosRecentes, error: gastosRecentesError },
    { data: notasFiscais, error: notasError },
    statsAcompanhamento,
  ] = await Promise.all([
    obrasQuery,
    gastosQuery,
    gastosRecentesQuery,
    notasQuery,
    obterStatsDashboardAcompanhamento(
      supabase,
      obraId ? { obraId } : undefined
    ).catch(() => ({
      totalUltimos7Dias: 0,
      ultimaObraNome: null,
      ultimoFuncionarioNome: null,
    })),
  ]);

  const obrasLista = (obras ?? []) as ObraDashboard[];
  const gastosLista = (gastos ?? []) as GastoDashboard[];
  const movimentacoes = (gastosRecentes ?? []) as GastoRecente[];

  const gastoRealizadoCalculado = gastosLista.reduce(
    (sum, gasto) => sum + (gasto.valor_total ?? 0),
    0
  );

  const valorContratado = obrasLista.reduce(
    (sum, obra) => sum + (obra.orcamento_previsto ?? 0),
    0
  );
  const totalRecebido = obrasLista.reduce(
    (sum, obra) => sum + (obra.valor_recebido ?? 0),
    0
  );
  const gastoRealizado = obraFiltrada
    ? gastoRealizadoCalculado
    : obrasLista.reduce(
        (sum, obra) => sum + (obra.gasto_realizado ?? 0),
        0
      );
  const lucroEstimado = obraFiltrada
    ? totalRecebido - gastoRealizado
    : obrasLista.reduce((sum, obra) => sum + calcularLucro(obra), 0);

  const gastosPorEtapa = agruparGastosPorEtapaDetalhado(gastosLista);
  const gastosPorCategoria = agruparPorCampo(gastosLista, "categoria");
  const ultimoGastoPorObra = buildUltimoGastoPorObra(gastosLista);
  const alertas = gerarAlertasDashboard(obrasLista, ultimoGastoPorObra);

  return {
    obrasLista,
    gastosLista,
    movimentacoes,
    notasFiscais: notasFiscais ?? [],
    statsAcompanhamento,
    errors: {
      obras: obrasError?.message,
      gastos: gastosError?.message,
      gastosRecentes: gastosRecentesError?.message,
      notas: notasError?.message,
    },
    metricas: {
      valorContratado,
      totalRecebido,
      gastoRealizado,
      lucroEstimado,
      totalObras: obrasLista.length,
      obrasEmAndamento: obrasLista.filter(
        (obra) => obra.status === "Em andamento"
      ).length,
      obrasConcluidas: obrasLista.filter(
        (obra) => obra.status === "Concluída"
      ).length,
    },
    gastosPorEtapa,
    gastosPorCategoria,
    alertas,
    obraFiltrada,
  };
}
