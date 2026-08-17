import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ObraEtapaGastosClient from "@/app/components/obras/ObraEtapaGastosClient";
import PageShell from "@/app/components/PageShell";
import {
  CATEGORIA_MAO_DE_OBRA,
  TIPO_CONSULTA_MAO_DE_OBRA,
} from "@/lib/gastos-mao-de-obra";
import {
  consultarGastosMaoDeObraObra,
  consultarGastosPorEtapaObra,
} from "@/lib/obras/gastos-por-etapa-consulta";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ etapa?: string; tipo?: string }>;
};

export default async function ObraEtapaGastosPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { etapa: etapaParam, tipo: tipoParam } = await searchParams;
  const etapa = etapaParam?.trim();
  const tipo = tipoParam?.trim();

  const isMaoDeObra = tipo === TIPO_CONSULTA_MAO_DE_OBRA;

  if (!isMaoDeObra && !etapa) {
    redirect(`/obras/${id}`);
  }

  const supabase = await createSupabaseServerClient();

  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select("id, nome")
    .eq("id", id)
    .maybeSingle();

  if (obraError) {
    return (
      <PageShell
        title="Gastos da obra"
        maxWidth="full"
        action={
          <Link
            href={`/obras/${id}`}
            className="text-sm font-medium text-[var(--cedro-text-muted)] transition-colors hover:text-[var(--cedro-text)]"
          >
            ← Voltar para a obra
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

  const rotuloConsulta = isMaoDeObra ? CATEGORIA_MAO_DE_OBRA : etapa!;

  let linhas: Awaited<
    ReturnType<typeof consultarGastosPorEtapaObra>
  >["linhas"] = [];
  let total = 0;
  let consultaError: Error | null = null;

  try {
    const resultado = isMaoDeObra
      ? await consultarGastosMaoDeObraObra(supabase, id)
      : await consultarGastosPorEtapaObra(supabase, id, etapa!);
    linhas = resultado.linhas;
    total = resultado.total;
  } catch (error) {
    consultaError =
      error instanceof Error ? error : new Error("Erro ao carregar lançamentos.");
  }

  return (
    <PageShell
      title={obra.nome}
      description={`Consulta de gastos — ${rotuloConsulta}`}
      maxWidth="full"
      action={
        <Link
          href={`/obras/${id}`}
          className="text-sm font-medium text-[var(--cedro-text-muted)] transition-colors hover:text-[var(--cedro-text)]"
        >
          ← Voltar para a obra
        </Link>
      }
    >
      {consultaError ? (
        <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-6 text-sm text-[var(--cedro-error)]">
          Erro ao carregar lançamentos: {consultaError.message}
        </div>
      ) : (
        <ObraEtapaGastosClient
          obraId={id}
          obraNome={obra.nome}
          etapa={rotuloConsulta}
          linhas={linhas}
          total={total}
        />
      )}
    </PageShell>
  );
}
