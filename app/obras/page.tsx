import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatCurrency, formatDate } from "@/lib/format";

type Obra = {
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
  clientes: { nome: string } | { nome: string }[] | null;
};

function getClienteNome(
  clientes: Obra["clientes"]
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
      return "bg-[var(--cedro-success-bg)] text-[var(--cedro-success)] ring-[var(--cedro-success)]/20";
    case "Pausada":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "Cancelada":
      return "bg-[var(--cedro-error-bg)] text-[var(--cedro-error)] ring-[var(--cedro-error)]/20";
    default:
      return "bg-[var(--cedro-bg)] text-[var(--cedro-text-muted)] ring-[var(--cedro-border)]";
  }
}

export default async function ObrasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: obras, error } = await supabase
    .from("obras")
    .select(
      "id, nome, status, orcamento_previsto, valor_recebido, gasto_realizado, lucro_estimado, data_inicio, data_previsao_termino, area_m2, clientes(nome)"
    )
    .order("data_inicio", { ascending: false });

  return (
    <PageShell
      title="Obras"
      description="Acompanhe todas as obras cadastradas no sistema."
      maxWidth="full"
      action={
        <Link
          href="/obras/nova"
          className="cedro-btn-primary px-4 py-2.5 text-sm"
        >
          Nova obra
        </Link>
      }
    >
      {error ? (
        <div className="rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-6 text-sm text-[var(--cedro-error)]">
          Erro ao carregar obras: {error.message}
        </div>
      ) : !obras?.length ? (
        <div className="cedro-card border-dashed p-12 text-center">
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Nenhuma obra cadastrada ainda.
          </p>
          <Link
            href="/obras/nova"
            className="mt-4 inline-flex text-sm font-medium text-[var(--cedro-brown)] underline underline-offset-4"
          >
            Cadastrar primeira obra
          </Link>
        </div>
      ) : (
        <div className="cedro-card overflow-hidden">
          <div className="cedro-table-wrap">
            <table className="cedro-table">
              <thead>
                <tr>
                  {[
                    "Obra",
                    "Cliente",
                    "Status",
                    "Orçamento",
                    "Recebido",
                    "Gasto",
                    "Lucro",
                    "Início",
                    "Término",
                    "Área",
                  ].map((header) => (
                    <th
                      key={header}
                      scope="col"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(obras as Obra[]).map((obra) => (
                  <tr key={obra.id}>
                    <td className="whitespace-nowrap font-medium">
                      <Link
                        href={`/obras/${obra.id}`}
                        className="text-[var(--cedro-brown)] underline-offset-4 transition-colors hover:underline"
                      >
                        {obra.nome}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {getClienteNome(obra.clientes)}
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(obra.status)}`}
                      >
                        {obra.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatCurrency(obra.orcamento_previsto ?? 0)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatCurrency(obra.valor_recebido ?? 0)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatCurrency(obra.gasto_realizado ?? 0)}
                    </td>
                    <td
                      className={`whitespace-nowrap font-medium ${
                        (obra.lucro_estimado ?? 0) >= 0
                          ? "text-[var(--cedro-success)]"
                          : "text-[var(--cedro-error)]"
                      }`}
                    >
                      {formatCurrency(obra.lucro_estimado ?? 0)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatDate(obra.data_inicio)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatDate(obra.data_previsao_termino)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {obra.area_m2 ? `${obra.area_m2} m²` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
