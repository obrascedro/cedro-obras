import Link from "next/link";
import { notFound } from "next/navigation";
import ObraAcompanhamentoSection from "@/app/components/ObraAcompanhamentoSection";
import ObraDetalheResumo from "@/app/components/obras/ObraDetalheResumo";
import PageShell from "@/app/components/PageShell";
import GastosPorEtapaChart from "@/app/components/GastosPorEtapaChart";
import ObraGastosSection from "@/app/components/ObraGastosSection";
import { listarClientesObraAdminAction } from "@/app/actions/obras-admin";
import { ADMIN_ROLE, getAppSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { agruparGastosPorEtapaDetalhado } from "@/lib/gastos-etapa";
import { listarGastosObra, somarGastosObra } from "@/lib/gastos-obra";
import { listarAcompanhamentosPorObra } from "@/lib/acompanhamento-obras/listar";

type ObraDetalhe = {
  id: string;
  nome: string;
  cliente_id: string;
  status: string;
  orcamento_previsto: number | null;
  valor_recebido: number | null;
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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ObraDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const session = await getAppSession();
  const isAdmin = session?.role === ADMIN_ROLE && session.ativo;

  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select(
      "id, nome, cliente_id, status, orcamento_previsto, valor_recebido, data_inicio, data_previsao_termino, area_m2, observacoes, clientes(nome)"
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
  let gastoRealizado = 0;

  try {
    [gastosLista, gastoRealizado] = await Promise.all([
      listarGastosObra(supabase, id),
      somarGastosObra(supabase, id),
    ]);
  } catch (error) {
    gastosError =
      error instanceof Error ? error : new Error("Erro ao carregar gastos.");
  }

  const gastosPorEtapa = agruparGastosPorEtapa(gastosLista);
  const valorRecebido = obraDetalhe.valor_recebido ?? 0;

  const [acompanhamentos, clientes] = await Promise.all([
    listarAcompanhamentosPorObra(supabase, id).catch(() => []),
    isAdmin ? listarClientesObraAdminAction().catch(() => []) : Promise.resolve([]),
  ]);

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
        <ObraDetalheResumo
          isAdmin={isAdmin}
          clientes={clientes}
          statusBadgeClass={statusBadgeClass(obraDetalhe.status)}
          obra={{
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
          }}
        />

        {gastosError ? (
          <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-6 text-sm text-[var(--cedro-error)]">
            Erro ao carregar gastos: {gastosError.message}
          </div>
        ) : (
          <>
            <ObraAcompanhamentoSection itens={acompanhamentos} obraId={id} />
            <GastosPorEtapaChart obraId={id} gastos={gastosLista} />
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
