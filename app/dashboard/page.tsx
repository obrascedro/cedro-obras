import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import DashboardCharts from "@/app/components/DashboardCharts";
import DashboardNotasPendentes from "@/app/components/DashboardNotasPendentes";
import { supabase } from "@/lib/supabase";
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

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl ${highlight ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const [
    { data: obras, error: obrasError },
    { data: gastos, error: gastosError },
    { data: gastosRecentes, error: gastosRecentesError },
    { data: notasFiscais, error: notasError },
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
      ),
    supabase
      .from("gastos_obra")
      .select(
        "id, data_gasto, descricao, etapa, valor_total, obra_id, obras(nome)"
      )
      .order("data_gasto", { ascending: false })
      .limit(10),
    supabase
      .from("notas_fiscais")
      .select("status_processamento, valor_total, itens_json"),
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

  return (
    <PageShell
      title="Dashboard"
      description="Visão geral das obras, gastos e alertas."
      maxWidth="full"
      action={
        <Link
          href="/obras/nova"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Nova obra
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {obrasError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            Erro ao carregar obras: {obrasError.message}
          </div>
        ) : null}

        {gastosError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            Erro ao carregar gastos: {gastosError.message}
          </div>
        ) : null}

        {gastosRecentesError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            Erro ao carregar movimentações: {gastosRecentesError.message}
          </div>
        ) : null}

        {notasError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            Erro ao carregar notas fiscais: {notasError.message}
          </div>
        ) : (
          <DashboardNotasPendentes notas={notasFiscais ?? []} />
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          <SummaryCard
            label="Valor contratado"
            value={formatCurrency(valorContratado)}
          />
          <SummaryCard
            label="Valor recebido"
            value={formatCurrency(totalRecebido)}
          />
          <SummaryCard
            label="Gasto realizado"
            value={formatCurrency(gastoRealizado)}
          />
          <SummaryCard
            label="Lucro estimado"
            value={formatCurrency(lucroEstimado)}
            highlight={
              lucroEstimado >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }
          />
          <SummaryCard label="Número de obras" value={String(totalObras)} />
          <SummaryCard
            label="Obras em andamento"
            value={String(obrasEmAndamento)}
          />
          <SummaryCard
            label="Obras concluídas"
            value={String(obrasConcluidas)}
          />
        </section>

        <DashboardCharts
          gastosPorEtapa={gastosPorEtapa}
          gastosPorCategoria={gastosPorCategoria}
        />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm xl:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Últimas movimentações
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Gastos mais recentes cadastrados no sistema.
              </p>
            </div>

            {movimentacoes.length === 0 ? (
              <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
                Nenhuma movimentação registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                    <tr>
                      {["Data", "Obra", "Descrição", "Etapa", "Valor"].map(
                        (header) => (
                          <th
                            key={header}
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {movimentacoes.map((gasto) => (
                      <tr
                        key={gasto.id}
                        className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                      >
                        <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                          {formatDate(gasto.data_gasto)}
                        </td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          <Link
                            href={`/obras/${gasto.obra_id}`}
                            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
                          >
                            {getObraNome(gasto.obras)}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {gasto.descricao}
                        </td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                          {gasto.etapa || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                          {formatCurrency(gasto.valor_total ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Alertas
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Obras que precisam de atenção.
            </p>

            {alertas.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
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
