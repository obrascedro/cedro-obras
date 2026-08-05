import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { supabase } from "@/lib/supabase";
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
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Pausada":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300";
    case "Cancelada":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export default async function ObrasPage() {
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
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Nova obra
        </Link>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Erro ao carregar obras: {error.message}
        </div>
      ) : !obras?.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhuma obra cadastrada ainda.
          </p>
          <Link
            href="/obras/nova"
            className="mt-4 inline-flex text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Cadastrar primeira obra
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
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
                      className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(obras as Obra[]).map((obra) => (
                  <tr
                    key={obra.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                      <Link
                        href={`/obras/${obra.id}`}
                        className="text-zinc-900 underline-offset-4 transition-colors hover:text-zinc-600 hover:underline dark:text-zinc-50 dark:hover:text-zinc-300"
                      >
                        {obra.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {getClienteNome(obra.clientes)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(obra.status)}`}
                      >
                        {obra.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatCurrency(obra.orcamento_previsto ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatCurrency(obra.valor_recebido ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatCurrency(obra.gasto_realizado ?? 0)}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-medium whitespace-nowrap ${
                        (obra.lucro_estimado ?? 0) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(obra.lucro_estimado ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatDate(obra.data_inicio)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatDate(obra.data_previsao_termino)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
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
