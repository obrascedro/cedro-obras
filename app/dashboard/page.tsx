import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import DashboardAcompanhamentoCard from "@/app/components/DashboardAcompanhamentoCard";
import DashboardCharts from "@/app/components/DashboardCharts";
import DashboardNotasPendentes from "@/app/components/DashboardNotasPendentes";
import MetricCard from "@/app/components/ui/MetricCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAppSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { agruparGastosPorEtapaDetalhado } from "@/lib/gastos-etapa";
import {
  agruparPorCampo,
  alertaBadgeClass,
  buildUltimoGastoPorObra,
  calcularLucro,
  gerarAlertasDashboard,
  getObraNome,
  type GastoDashboard,
  type GastoRecente,
  type ObraDashboard,
} from "@/lib/dashboard";
import { obterStatsDashboardAcompanhamento } from "@/lib/acompanhamento-obras/listar";

export default async function DashboardPage() {
  const session = await getAppSession();
  const supabase = await createSupabaseServerClient();
  const [
    { data: obras, error: obrasError },
    { data: gastos, error: gastosError },
    { data: gastosRecentes, error: gastosRecentesError },
    { data: notasFiscais, error: notasError },
    statsAcompanhamento,
  ] = await Promise.all([
    supabase
      .from("obras")
      .select(
        "id, nome, status, orcamento_previsto, valor_recebido, gasto_realizado, lucro_estimado, data_previsao_termino, clientes(nome)"
      )
      .order("data_inicio", { ascending: false }),
    supabase
      .from("gastos_obra")
      .select(
        "obra_id, etapa, categoria, valor_total, data_gasto, criado_em"
      )
      .order("criado_em", { ascending: false })
      .limit(2000),
    supabase
      .from("gastos_obra")
      .select(
        "id, data_gasto, descricao, etapa, valor_total, obra_id, obras(nome)"
      )
      .order("data_gasto", { ascending: false })
      .limit(10),
    supabase
      .from("notas_fiscais")
      .select("status_processamento, valor_total, itens_json")
      .order("criado_em", { ascending: false })
      .limit(500),
    obterStatsDashboardAcompanhamento(supabase).catch(() => ({
      totalUltimos7Dias: 0,
      ultimaObraNome: null,
      ultimoFuncionarioNome: null,
    })),
  ]);

  const obrasLista = (obras ?? []) as ObraDashboard[];
  const gastosLista = (gastos ?? []) as GastoDashboard[];
  const movimentacoes = (gastosRecentes ?? []) as GastoRecente[];

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
  const lucroEstimado = obrasLista.reduce(
    (sum, obra) => sum + calcularLucro(obra),
    0
  );
  const totalObras = obrasLista.length;
  const obrasEmAndamento = obrasLista.filter(
    (obra) => obra.status === "Em andamento"
  ).length;
  const obrasConcluidas = obrasLista.filter(
    (obra) => obra.status === "Concluída"
  ).length;

  const gastosPorEtapa = agruparGastosPorEtapaDetalhado(gastosLista);
  const gastosPorCategoria = agruparPorCampo(gastosLista, "categoria");
  const ultimoGastoPorObra = buildUltimoGastoPorObra(gastosLista);
  const alertas = gerarAlertasDashboard(obrasLista, ultimoGastoPorObra);

  const greeting = session?.nome
    ? `Bem-vindo, ${session.nome}!`
    : "Bem-vindo!";

  return (
    <PageShell
      title="Dashboard"
      greeting={greeting}
      description="Visão geral das obras, gastos e alertas do sistema."
      maxWidth="full"
      action={
        <Link href="/obras/nova" className="cedro-btn-primary px-4 py-2.5 text-sm">
          Nova obra
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {obrasError ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar obras: {obrasError.message}
          </div>
        ) : null}

        {gastosError ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar gastos: {gastosError.message}
          </div>
        ) : null}

        {gastosRecentesError ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar movimentações: {gastosRecentesError.message}
          </div>
        ) : null}

        {notasError ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
            Erro ao carregar notas fiscais: {notasError.message}
          </div>
        ) : (
          <DashboardNotasPendentes notas={notasFiscais ?? []} />
        )}

        <DashboardAcompanhamentoCard stats={statsAcompanhamento} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Valor contratado"
            value={formatCurrency(valorContratado)}
            iconBg="brown"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            label="Valor recebido"
            value={formatCurrency(totalRecebido)}
            iconBg="teal"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            label="Gasto realizado"
            value={formatCurrency(gastoRealizado)}
            iconBg="orange"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />
          <MetricCard
            label="Lucro estimado"
            value={formatCurrency(lucroEstimado)}
            iconBg="green"
            valueClassName={
              lucroEstimado >= 0
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Número de obras" value={String(totalObras)} iconBg="brown" />
          <MetricCard label="Obras em andamento" value={String(obrasEmAndamento)} iconBg="teal" />
          <MetricCard label="Obras concluídas" value={String(obrasConcluidas)} iconBg="green" />
        </section>

        <DashboardCharts
          gastosPorEtapa={gastosPorEtapa}
          gastosPorCategoria={gastosPorCategoria}
        />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="cedro-card overflow-hidden xl:col-span-2">
            <div className="border-b border-[var(--cedro-border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
                Últimas movimentações
              </h2>
              <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
                Gastos mais recentes cadastrados no sistema.
              </p>
            </div>

            {movimentacoes.length === 0 ? (
              <p className="p-6 text-sm text-[var(--cedro-text-muted)]">
                Nenhuma movimentação registrada ainda.
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
                    {movimentacoes.map((gasto) => (
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
              Obras que precisam de atenção.
            </p>

            {alertas.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--cedro-text-muted)]">
                Nenhum alerta no momento.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {alertas.map((alerta) => (
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
      </div>
    </PageShell>
  );
}
