import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import EngenheiroCedroClient from "@/app/components/engenheiro-cedro/EngenheiroCedroClient";
import { listarConversasEngenheiroCedro } from "@/app/actions/engenheiro-cedro";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  const [{ data: obras, error: obrasError }, conversas] = await Promise.all([
    supabase.from("obras").select("id, nome").order("nome"),
    listarConversasEngenheiroCedro(),
  ]);

  return (
    <PageShell
      title="Engenheiro Cedro"
      description="Assistente inteligente de obras — perguntas em linguagem natural com dados reais do sistema."
      maxWidth="full"
      action={
        <Link
          href="/financeiro"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar ao Financeiro
        </Link>
      }
    >
      {obrasError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Erro ao carregar obras: {obrasError.message}
        </div>
      ) : null}

      <EngenheiroCedroClient
        obras={obras ?? []}
        conversasIniciais={conversas}
      />
    </PageShell>
  );
}
