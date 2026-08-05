import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import EngenheiroCedroClient from "@/app/components/engenheiro-cedro/EngenheiroCedroClient";
import {
  listarConversasEngenheiroCedro,
  obterStatusStorageAssistente,
} from "@/app/actions/engenheiro-cedro";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: obras, error: obrasError }, conversas, storage] =
    await Promise.all([
      supabase.from("obras").select("id, nome").order("nome"),
      listarConversasEngenheiroCedro(),
      obterStatusStorageAssistente(),
    ]);

  return (
    <PageShell
      title="Engenheiro Cedro"
      description="Assistente inteligente de obras — perguntas em linguagem natural com dados reais do sistema."
      maxWidth="full"
      action={
        <Link
          href="/financeiro"
          className="text-sm font-medium text-[var(--cedro-text-muted)] transition-colors hover:text-[var(--cedro-brown)]"
        >
          ← Voltar ao Financeiro
        </Link>
      }
    >
      {obrasError ? (
        <div className="mb-6 rounded-xl border border-[var(--cedro-error)]/30 bg-[var(--cedro-error-bg)] p-4 text-sm text-[var(--cedro-error)]">
          Erro ao carregar obras: {obrasError.message}
        </div>
      ) : null}

      {!storage.disponivel && storage.aviso ? (
        <div
          className="mb-6 rounded-xl border border-[var(--cedro-warning)]/40 bg-[var(--cedro-warning-bg)] p-4 text-sm text-[var(--cedro-text)]"
          role="status"
        >
          {storage.aviso}
        </div>
      ) : null}

      <EngenheiroCedroClient
        obras={obras ?? []}
        conversasIniciais={conversas}
        storageDisponivel={storage.disponivel}
      />
    </PageShell>
  );
}
