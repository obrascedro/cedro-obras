import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/app/components/PageShell";
import GastosPorEtapaChart from "@/app/components/GastosPorEtapaChart";
import ObraGastosSection, {
  type GastoObra,
} from "@/app/components/ObraGastosSection";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import { agruparGastosPorEtapaDetalhado } from "@/lib/gastos-etapa";

type ObraDetalhe = {
  id: string;
  nome: string;
  status: string;
  orcamento_previsto: number | null;
  valor_recebido: number | null;
  gasto_realizado: number | null;
  lucro_estimado: number | null;
  data_inicio: string | null;
  data_previsao_termino: string | null;
  area_m2: number | null;
  observacoes: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
};

function getClienteNome(
  clientes: ObraDetalhe["clientes"]
): string {
  if (!clientes) return "—";
  if (Array.isArray(clientes)) return clientes[0]?.nome ?? "—";
  return clientes.nome;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "Em andamento":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300";
    case "Concluída":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Pausada":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300";
    case "Cancelada":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function agruparGastosPorEtapa(gastos: GastoObra[]) {
  return agruparGastosPorEtapaDetalhado(gastos).map(({ etapa, total }) => ({
    etapa,
    total,
  }));
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ObraDetalhePage({ params }: PageProps) {
  const { id } = await params;

  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select(
      "id, nome, status, orcamento_previsto, valor_recebido, gasto_realizado, lucro_estimado, data_inicio, data_previsao_termino, area_m2, observacoes, clientes(nome)"
    )
    .eq("id", id)
    .maybeSingle();

  if (obraError) {
    return (
      <PageShell
        title="Detalhes da obra"
        maxWidth="xl"
        action={
          <Link
            href="/obras"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Voltar para obras
          </Link>
        }
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Erro ao carregar obra: {obraError.message}
        </div>
      </PageShell>
    );
  }

  if (!obra) {
    notFound();
  }

  const obraDetalhe = obra as ObraDetalhe;

  const { data: gastos, error: gastosError } = await supabase
    .from("gastos_obra")
    .select(
      "id, etapa, categoria, descricao, fornecedor, quantidade, valor_unitario, valor_total, data_gasto"
    )
    .eq("obra_id", id)
    .order("data_gasto", { ascending: false });

  const gastosLista = (gastos ?? []) as GastoObra[];
  const totalGasto = gastosLista.reduce(
    (sum, gasto) => sum + (gasto.valor_total ?? 0),
    0
  );
  const gastosPorEtapa = agruparGastosPorEtapa(gastosLista);
  const lucroEstimado =
    (obraDetalhe.valor_recebido ?? 0) - (obraDetalhe.gasto_realizado ?? 0);

  return (
    <PageShell
      title={obraDetalhe.nome}
      description={`Cliente: ${getClienteNome(obraDetalhe.clientes)}`}
      maxWidth="full"
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={`/obras/${id}/importar-gastos`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Importar planilha
          </Link>
          <Link
            href="/obras"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Voltar para obras
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(obraDetalhe.status)}`}
              >
                {obraDetalhe.status}
              </span>
              {obraDetalhe.area_m2 ? (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {obraDetalhe.area_m2} m²
                </span>
              ) : null}
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Data de início
                </dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                  {formatDate(obraDetalhe.data_inicio)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Previsão de término
                </dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                  {formatDate(obraDetalhe.data_previsao_termino)}
                </dd>
              </div>
            </dl>

            {obraDetalhe.observacoes ? (
              <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Observações
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {obraDetalhe.observacoes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                label: "Orçamento previsto",
                value: formatCurrency(obraDetalhe.orcamento_previsto ?? 0),
              },
              {
                label: "Valor recebido",
                value: formatCurrency(obraDetalhe.valor_recebido ?? 0),
              },
              {
                label: "Gasto realizado",
                value: formatCurrency(obraDetalhe.gasto_realizado ?? 0),
              },
              {
                label: "Lucro estimado",
                value: formatCurrency(lucroEstimado),
                highlight:
                  lucroEstimado >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {item.label}
                </p>
                <p
                  className={`mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50 ${item.highlight ?? ""}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {gastosError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            Erro ao carregar gastos: {gastosError.message}
          </div>
        ) : (
          <>
            <GastosPorEtapaChart gastos={gastosLista} />
            <ObraGastosSection
              obraId={id}
              gastos={gastosLista}
              totalGasto={totalGasto}
              gastosPorEtapa={gastosPorEtapa}
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
