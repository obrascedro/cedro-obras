import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import NotasFiscaisClient from "@/app/components/NotasFiscaisClient";
import { supabase } from "@/lib/supabase";
import type { NotaFiscal, ObraOption } from "@/lib/notas-fiscais";

export default async function NotasFiscaisPage() {
  const [
    { data: obras, error: obrasError },
    { data: notas, error: notasError },
  ] = await Promise.all([
    supabase.from("obras").select("id, nome").order("nome"),
    supabase
      .from("notas_fiscais")
      .select(
        "id, obra_id, arquivo_path, arquivo_nome, arquivo_tipo, arquivo_tamanho, fornecedor, data_nota, valor_total, observacoes, origem, status_processamento, criado_em, enviado_por_nome, aprovado_por_nome, aprovado_em, rejeitado_por_nome, motivo_rejeicao, mensagem_correcao, leitura_json, itens_json, obras(nome)"
      )
      .order("criado_em", { ascending: false }),
  ]);

  return (
    <PageShell
      title="Notas fiscais"
      description="Envie imagens ou PDFs de notas para organizar os gastos das obras."
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

      {notasError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Erro ao carregar notas fiscais: {notasError.message}
          <p className="mt-2 text-xs">
            Verifique se a tabela e o bucket foram criados executando{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-950">
              supabase/notas-fiscais.sql
            </code>{" "}
            no Supabase.
          </p>
        </div>
      ) : null}

      <NotasFiscaisClient
        obras={(obras ?? []) as ObraOption[]}
        notasIniciais={(notas ?? []) as NotaFiscal[]}
      />
    </PageShell>
  );
}
