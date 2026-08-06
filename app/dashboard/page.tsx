import Link from "next/link";
import { redirect } from "next/navigation";
import PageShell from "@/app/components/PageShell";
import DashboardAcompanhamentoCard from "@/app/components/DashboardAcompanhamentoCard";
import DashboardCharts from "@/app/components/DashboardCharts";
import DashboardNotasPendentes from "@/app/components/DashboardNotasPendentes";
import DashboardObraFilter from "@/app/components/DashboardObraFilter";
import MetricCard from "@/app/components/ui/MetricCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAppSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { carregarDashboardData } from "@/lib/dashboard-data";
import {
  calcularPercentualOrcamentoUtilizado,
  listarObrasParaFiltroDashboard,
  resolverFiltroObraDashboard,
} from "@/lib/dashboard-filtro";
import {
  alertaBadgeClass,
  getObraNome,
} from "@/lib/dashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ obra?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getAppSession();
  const supabase = await createSupabaseServerClient();

  const obrasOpcoes = await listarObrasParaFiltroDashboard(supabase);
  const filtro = await resolverFiltroObraDashboard(
    supabase,
    params.obra,
    obrasOpcoes
  );

  if (filtro.redirectParaTodas) {
    redirect("/dashboard");
  }

  const data = await carregarDashboardData(supabase, filtro.obraId);
  const obraSelecionada = filtro.obraSelecionada;
  const obraFiltrada = Boolean(filtro.obraId);
  const obraAtual = data.obrasLista[0] ?? null;

  const greeting = session?.nome
    ? `Bem-vindo, ${session.nome}!`
    : "Bem-vindo!";

  const pageTitle = obraSelecionada
    ? `Dashboard — ${obraSelecionada.nome}`
    : "Dashboard";

  const pageDescription = obraSelecionada
    ? `Indicadores financeiros e operacionais da obra ${obraSelecionada.nome}.`
    : "Visão geral das obras, gastos e alertas do sistema.";

  const percentualOrcamento = obraAtual
    ? calcularPercentualOrcamentoUtilizado(
        obraAtual.orcamento_previsto,
        data.metricas.gastoRealizado
      )
    : null;

  const semGastosObra =
    obraFiltrada && data.gastosLista.length === 0 && !data.errors.gastos;

  return (
    <PageShell
      title={pageTitle}
      greeting={greeting}
      description={pageDescription}
      maxWidth="full"
      action={
        <Link href="/obras/nova" className="cedro-btn-primary px-4 py-2.5 text-sm">
          Nova obra
        </Link>
      }
    >
      <DashboardObraFilter
        obras={obrasOpcoes}
        obraSelecionadaId={filtro.obraId}
        obraSelecionadaNome={obraSelecionada?.nome ?? null}
      >
        {semGastosObra ? (
          <div className="rounded-xl border border-dashed border-[var(--cedro-border)] bg-[var(--cedro-bg)] p-4 text-sm text-[var(--cedro-text-muted)]">
            Ainda não existem gastos cadastrados para esta obra.
          </div>
        ) : null}

        {data.errors.obras ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar obras: {data.errors.obras}
          </div>
        ) : null}

        {data.errors.gastos ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar gastos: {data.errors.gastos}
          </div>
        ) : null}

        {data.errors.gastosRecentes ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar movimentações: {data.errors.gastosRecentes}
          </div>
        ) : null}

        {data.errors.notas ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar notas fiscais: {data.errors.notas}
          </div>
        ) : (
          <DashboardNotasPendentes
            notas={data.notasFiscais}
            obraFiltradaNome={obraSelecionada?.nome ?? null}
          />
        )}

        <DashboardAcompanhamentoCard
          stats={data.statsAcompanhamento}
          obraFiltradaId={filtro.obraId}
          obraFiltradaNome={obraSelecionada?.nome ?? null}
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Valor contratado"
            value={formatCurrency(data.metricas.valorContratado)}
            iconBg="brown"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            label="Valor recebido"
            value={formatCurrency(data.metricas.totalRecebido)}
            iconBg="teal"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            label="Gasto realizado"
            value={formatCurrency(data.metricas.gastoRealizado)}
            iconBg="orange"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />
          <MetricCard
            label="Lucro estimado"
            value={formatCurrency(data.metricas.lucroEstimado)}
            iconBg="green"
            valueClassName={
              data.metricas.lucroEstimado >= 0
                ? "text-[var(--cedro-success)]"
                : "text-[var(--cedro-error)]"
            }
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </section>

        {obraFiltrada && obraAtual ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Status da obra"
              value={obraAtual.status}
              iconBg="teal"
            />
            <MetricCard
              label="Orçamento utilizado"
              value={
                percentualOrcamento != null
                  ? `${percentualOrcamento}%`
                  : "—"
              }
              iconBg="orange"
            />
            <MetricCard
              label="Previsão de término"
              value={
                obraAtual.data_previsao_termino
                  ? formatDate(obraAtual.data_previsao_termino)
                  : "Não informada"
              }
              iconBg="brown"
            />
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Número de obras"
              value={String(data.metricas.totalObras)}
              iconBg="brown"
            />
            <MetricCard
              label="Obras em andamento"
              value={String(data.metricas.obrasEmAndamento)}
              iconBg="teal"
            />
            <MetricCard
              label="Obras concluídas"
              value={String(data.metricas.obrasConcluidas)}
              iconBg="green"
            />
          </section>
        )}

        <DashboardCharts
          gastosPorEtapa={data.gastosPorEtapa}
          gastosPorCategoria={data.gastosPorCategoria}
        />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="cedro-card overflow-hidden xl:col-span-2">
            <div className="border-b border-[var(--cedro-border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
                Últimas movimentações
              </h2>
              <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
                {obraFiltrada
                  ? "Gastos mais recentes desta obra."
                  : "Gastos mais recentes cadastrados no sistema."}
              </p>
            </div>

            {data.movimentacoes.length === 0 ? (
              <p className="p-6 text-sm text-[var(--cedro-text-muted)]">
                {obraFiltrada
                  ? "Nenhuma movimentação registrada para esta obra."
                  : "Nenhuma movimentação registrada ainda."}
              </p>
            ) : (
              <div className="cedro-table-wrap">
                <table className="cedro-table">
                  <thead>
                    <tr>
                      {["Data", "Obra", "Descrição", "Etapa", "Valor"].map(
                        (header) => (
                          <th key={header} scope="col">
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.movimentacoes.map((gasto) => (
                      <tr key={gasto.id}>
                        <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                          {formatDate(gasto.data_gasto)}
                        </td>
                        <td className="whitespace-nowrap">
                          <Link
                            href={`/obras/${gasto.obra_id}`}
                            className="font-medium text-[var(--cedro-brown)] underline-offset-4 hover:underline"
                          >
                            {getObraNome(gasto.obras)}
                          </Link>
                        </td>
                        <td className="text-[var(--cedro-text-muted)]">
                          {gasto.descricao}
                        </td>
                        <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                          {gasto.etapa || "—"}
                        </td>
                        <td className="whitespace-nowrap font-medium">
                          {formatCurrency(gasto.valor_total ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="cedro-card p-6">
            <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
              Alertas
            </h2>
            <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
              {obraFiltrada
                ? "Situações que precisam de atenção nesta obra."
                : "Obras que precisam de atenção."}
            </p>

            {data.alertas.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--cedro-text-muted)]">
                {obraFiltrada
                  ? "Nenhum alerta para esta obra no momento."
                  : "Nenhum alerta no momento."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.alertas.map((alerta) => (
                  <li
                    key={alerta.id}
                    className={`rounded-xl border px-4 py-3 ${alertaBadgeClass(alerta.tipo)}`}
                  >
                    <Link
                      href={`/obras/${alerta.obraId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {alerta.nome}
                    </Link>
                    <p className="mt-1 text-sm">{alerta.mensagem}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </DashboardObraFilter>
    </PageShell>
  );
}
