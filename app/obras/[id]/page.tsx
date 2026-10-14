import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import GastosPorEtapaChartLazy from "@/app/components/GastosPorEtapaChartLazy";
import ObraAcompanhamentoAsync from "@/app/components/obras/ObraAcompanhamentoAsync";
import ObraDetalheResumoLoader from "@/app/components/obras/ObraDetalheResumoLoader";
import ObraDetalheResumo from "@/app/components/obras/ObraDetalheResumo";
import PageShell from "@/app/components/PageShell";
import ObraGastosSection from "@/app/components/ObraGastosSection";
import { ADMIN_ROLE, getAppSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { agruparGastosPorEtapaDetalhado } from "@/lib/gastos-etapa";
import { listarGastosObra } from "@/lib/gastos-obra";

type ObraDetalhe = {
  id: string;
  nome: string;
  cliente_id: string;
  status: string;
  orcamento_previsto: number | null;
  valor_recebido: number | null;
  gasto_realizado: number | null;
  data_inicio: string | null;
  data_previsao_termino: string | null;
  area_m2: number | null;
  observacoes: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
};

function getClienteNome(clientes: ObraDetalhe["clientes"]): string {
  if (!clientes) return "—";
  if (Array.isArray(clientes)) return clientes[0]?.nome ?? "—";
  return clientes.nome;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "Em andamento":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300";
    case "Concluída":
      return "bg-[var(--cedro-success-bg)] text-[var(--cedro-success)] ring-[var(--cedro-success)]/20";
    case "Pausada":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "Cancelada":
      return "bg-[var(--cedro-error-bg)] text-[var(--cedro-error)] ring-[var(--cedro-error)]/20";
    default:
      return "bg-[var(--cedro-bg)] text-[var(--cedro-text-muted)] ring-[var(--cedro-border)]";
  }
}

function agruparGastosPorEtapa(
  gastos: Awaited<ReturnType<typeof listarGastosObra>>
) {
  return agruparGastosPorEtapaDetalhado(gastos).map(({ etapa, total }) => ({
    etapa,
    total,
  }));
}

function ObraResumoFallback() {
  return (
    <div
      className="cedro-card h-48 animate-pulse bg-[var(--cedro-bg)]"
      aria-busy="true"
      aria-label="Carregando resumo da obra"
    />
  );
}

function ObraAcompanhamentoFallback() {
  return (
    <div
      className="cedro-card h-40 animate-pulse bg-[var(--cedro-bg)]"
      aria-busy="true"
      aria-label="Carregando acompanhamento"
    />
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ObraDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [session, obraResult] = await Promise.all([
    getAppSession(),
    supabase
      .from("obras")
      .select(
        "id, nome, cliente_id, status, orcamento_previsto, valor_recebido, gasto_realizado, data_inicio, data_previsao_termino, area_m2, observacoes, clientes(nome)"
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  const isAdmin = session?.role === ADMIN_ROLE && session.ativo;
  const { data: obra, error: obraError } = obraResult;

  if (obraError) {
    return (
      <PageShell
        title="Detalhes da obra"
        maxWidth="xl"
        action={
          <Link
            href="/obras"
            className="text-sm font-medium text-[var(--cedro-text-muted)] transition-colors hover:text-[var(--cedro-text)]"
          >
            ← Voltar para obras
          </Link>
        }
      >
        <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-6 text-sm text-[var(--cedro-error)]">
          Erro ao carregar obra: {obraError.message}
        </div>
      </PageShell>
    );
  }

  if (!obra) {
    notFound();
  }

  const obraDetalhe = obra as ObraDetalhe;

  let gastosLista: Awaited<ReturnType<typeof listarGastosObra>> = [];
  let gastosError: Error | null = null;

  try {
    gastosLista = await listarGastosObra(supabase, id);
  } catch (error) {
    gastosError =
      error instanceof Error ? error : new Error("Erro ao carregar gastos.");
  }

  const gastosPorEtapa = agruparGastosPorEtapa(gastosLista);
  const valorRecebido = obraDetalhe.valor_recebido ?? 0;
  const gastoRealizado = gastosError
    ? (obraDetalhe.gasto_realizado ?? 0)
    : gastosLista.reduce((sum, g) => sum + (g.valor_total ?? 0), 0);

  const obraResumo = {
    id: obraDetalhe.id,
    nome: obraDetalhe.nome,
    clienteId: obraDetalhe.cliente_id,
    clienteNome: getClienteNome(obraDetalhe.clientes),
    status: obraDetalhe.status,
    orcamentoPrevisto: obraDetalhe.orcamento_previsto ?? 0,
    valorRecebido,
    gastoRealizado,
    dataInicio: obraDetalhe.data_inicio,
    dataPrevisaoTermino: obraDetalhe.data_previsao_termino,
    areaM2: obraDetalhe.area_m2,
    observacoes: obraDetalhe.observacoes,
  };

  return (
    <PageShell
      title={obraDetalhe.nome}
      description={`Cliente: ${getClienteNome(obraDetalhe.clientes)}`}
      maxWidth="full"
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isAdmin ? (
            <Link
              href={`/obras/${id}/importar-gastos`}
              className="cedro-btn-secondary px-4 py-2.5 text-sm"
            >
              Importar planilha
            </Link>
          ) : null}
          <Link
            href="/obras"
            className="text-sm font-medium text-[var(--cedro-text-muted)] transition-colors hover:text-[var(--cedro-text)]"
          >
            ← Voltar para obras
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {isAdmin ? (
          <Suspense fallback={<ObraResumoFallback />}>
            <ObraDetalheResumoLoader
              isAdmin={isAdmin}
              statusBadgeClass={statusBadgeClass(obraDetalhe.status)}
              obra={obraResumo}
            />
          </Suspense>
        ) : (
          <ObraDetalheResumo
            isAdmin={false}
            clientes={[]}
            statusBadgeClass={statusBadgeClass(obraDetalhe.status)}
            obra={obraResumo}
          />
        )}

        {gastosError ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-6 text-sm text-[var(--cedro-error)]">
            Erro ao carregar gastos: {gastosError.message}
          </div>
        ) : (
          <>
            <Suspense fallback={<ObraAcompanhamentoFallback />}>
              <ObraAcompanhamentoAsync obraId={id} />
            </Suspense>
            <GastosPorEtapaChartLazy obraId={id} gastos={gastosLista} />
            <ObraGastosSection
              obraId={id}
              gastos={gastosLista}
              totalGasto={gastoRealizado}
              gastosPorEtapa={gastosPorEtapa}
              isAdmin={isAdmin}
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
