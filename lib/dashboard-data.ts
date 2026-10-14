import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
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

export type DashboardMetricas = {
  valorContratado: number;
  totalRecebido: number;
  gastoRealizado: number;
  lucroEstimado: number;
  totalObras: number;
  obrasEmAndamento: number;
  obrasConcluidas: number;
};

export type DashboardEssencial = {
  obrasLista: ObraDashboard[];
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
    gastosRecentes?: string;
    notas?: string;
  };
  metricas: DashboardMetricas;
  obraFiltrada: boolean;
};

export type DashboardAnalytics = {
  gastosLista: GastoDashboard[];
  gastosPorEtapa: ReturnType<typeof agruparGastosPorEtapaDetalhado>;
  gastosPorCategoria: ReturnType<typeof agruparPorCampo>;
  alertas: ReturnType<typeof gerarAlertasDashboard>;
  errors: {
    gastos?: string;
  };
};

const OBRA_SELECT =
  "id, nome, status, orcamento_previsto, valor_recebido, gasto_realizado, lucro_estimado, data_previsao_termino, clientes(nome)";

const NOTAS_DASHBOARD_STATUSES = [
  "erro",
  "pendente_aprovacao",
  "revisar",
] as const;

function calcularMetricasDashboard(
  obrasLista: ObraDashboard[],
  obraFiltrada: boolean
): DashboardMetricas {
  const valorContratado = obrasLista.reduce(
    (sum, obra) => sum + (obra.orcamento_previsto ?? 0),
    0
  );
  const totalRecebido = obrasLista.reduce(
    (sum, obra) => sum + (obra.valor_recebido ?? 0),
    0
  );
  const gastoRealizado = obrasLista.reduce(
    (sum, obra) => sum + (obra.gasto_realizado ?? 0),
    0
  );
  const lucroEstimado = obraFiltrada
    ? totalRecebido - gastoRealizado
    : obrasLista.reduce((sum, obra) => sum + calcularLucro(obra), 0);

  return {
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
  };
}

/** Métricas, movimentações recentes e pendências — sem volume grande de gastos. */
export async function carregarDashboardEssencial(
  supabase: SupabaseClient,
  obraId: string | null
): Promise<DashboardEssencial> {
  const obraFiltrada = Boolean(obraId);

  let obrasQuery = supabase
    .from("obras")
    .select(OBRA_SELECT)
    .order("data_inicio", { ascending: false });

  if (obraId) {
    obrasQuery = obrasQuery.eq("id", obraId);
  }

  let gastosRecentesQuery = supabase
    .from("gastos_obra")
    .select("id, data_gasto, descricao, etapa, valor_total, obra_id, obras(nome)")
    .eq("ativo", true)
    .order("data_gasto", { ascending: false })
    .limit(10);

  if (obraId) {
    gastosRecentesQuery = gastosRecentesQuery.eq("obra_id", obraId);
  }

  let notasQuery = supabase
    .from("notas_fiscais")
    .select("status_processamento, valor_total, itens_json")
    .in("status_processamento", [...NOTAS_DASHBOARD_STATUSES])
    .order("criado_em", { ascending: false })
    .limit(200);

  if (obraId) {
    notasQuery = notasQuery.eq("obra_id", obraId);
  }

  const [
    { data: obras, error: obrasError },
    { data: gastosRecentes, error: gastosRecentesError },
    { data: notasFiscais, error: notasError },
    statsAcompanhamento,
  ] = await Promise.all([
    obrasQuery,
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
  const movimentacoes = (gastosRecentes ?? []) as GastoRecente[];

  return {
    obrasLista,
    movimentacoes,
    notasFiscais: notasFiscais ?? [],
    statsAcompanhamento,
    errors: {
      obras: obrasError?.message,
      gastosRecentes: gastosRecentesError?.message,
      notas: notasError?.message,
    },
    metricas: calcularMetricasDashboard(obrasLista, obraFiltrada),
    obraFiltrada,
  };
}

/** Gráficos e alertas de movimentação — consulta agregada de gastos. */
export async function carregarDashboardAnalytics(
  supabase: SupabaseClient,
  obraId: string | null,
  obrasLista: ObraDashboard[]
): Promise<DashboardAnalytics> {
  let gastosQuery = supabase
    .from("gastos_obra")
    .select("obra_id, etapa, categoria, valor_total, data_gasto, criado_em")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(obraId ? 5000 : 2000);

  if (obraId) {
    gastosQuery = gastosQuery.eq("obra_id", obraId);
  }

  const { data: gastos, error: gastosError } = await gastosQuery;

  const gastosLista = (gastos ?? []) as GastoDashboard[];
  const gastosPorEtapa = agruparGastosPorEtapaDetalhado(gastosLista);
  const gastosPorCategoria = agruparPorCampo(gastosLista, "categoria");
  const ultimoGastoPorObra = buildUltimoGastoPorObra(gastosLista);
  const alertas = gerarAlertasDashboard(obrasLista, ultimoGastoPorObra);

  return {
    gastosLista,
    gastosPorEtapa,
    gastosPorCategoria,
    alertas,
    errors: {
      gastos: gastosError?.message,
    },
  };
}

/** Uma consulta pesada de gastos por request (compartilhada entre gráficos e alertas). */
export const obterDashboardAnalyticsEmCache = cache(
  async (obraId: string | null) => {
    const supabase = await createSupabaseServerClient();

    let obrasQuery = supabase
      .from("obras")
      .select(OBRA_SELECT)
      .order("data_inicio", { ascending: false });

    if (obraId) {
      obrasQuery = obrasQuery.eq("id", obraId);
    }

    const { data: obras } = await obrasQuery;
    const obrasLista = (obras ?? []) as ObraDashboard[];

    const analytics = await carregarDashboardAnalytics(
      supabase,
      obraId,
      obrasLista
    );

    return { obrasLista, ...analytics, obraFiltrada: Boolean(obraId) };
  }
);

/** @deprecated Preferir carregarDashboardEssencial + carregarDashboardAnalytics */
export async function carregarDashboardData(
  supabase: SupabaseClient,
  obraId: string | null
) {
  const essencial = await carregarDashboardEssencial(supabase, obraId);
  const analytics = await carregarDashboardAnalytics(
    supabase,
    obraId,
    essencial.obrasLista
  );

  return {
    ...essencial,
    gastosLista: analytics.gastosLista,
    gastosPorEtapa: analytics.gastosPorEtapa,
    gastosPorCategoria: analytics.gastosPorCategoria,
    alertas: analytics.alertas,
    errors: {
      ...essencial.errors,
      gastos: analytics.errors.gastos,
    },
  };
}
