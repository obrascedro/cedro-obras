import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/app/components/PageShell";
import ImportarGastosClient from "@/app/components/ImportarGastosClient";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ImportarGastosPage({ params }: PageProps) {
  const { id } = await params;

  const { data: obra, error } = await supabase
    .from("obras")
    .select("id, nome")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <PageShell
        title="Importar gastos"
        maxWidth="full"
        action={
          <Link
            href={`/obras/${id}`}
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Voltar para obra
          </Link>
        }
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Erro ao carregar obra: {error.message}
        </div>
      </PageShell>
    );
  }

  if (!obra) {
    notFound();
  }

  return (
    <PageShell
      title="Importar gastos"
      description={`Obra: ${obra.nome}`}
      maxWidth="full"
      action={
        <Link
          href={`/obras/${id}`}
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para obra
        </Link>
      }
    >
      <ImportarGastosClient obraId={id} />
    </PageShell>
  );
}
