import Link from "next/link";
import { notFound } from "next/navigation";
import AdminAcompanhamentoDetalheClient from "@/app/components/admin-acompanhamento/AdminAcompanhamentoDetalheClient";
import PageShell from "@/app/components/PageShell";
import { obterAcompanhamentoAdminAction } from "@/app/actions/admin-acompanhamento";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AcompanhamentoObraDetalhePage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const { detalhe, erro } = await obterAcompanhamentoAdminAction(id);

  if (!detalhe) {
    if (erro) {
      return (
        <PageShell title="Acompanhamento" maxWidth="lg">
          <div className="cedro-card p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{erro}</p>
            <Link
              href="/acompanhamento-obras"
              className="mt-4 inline-block text-sm font-semibold text-[var(--cedro-brown)] hover:underline"
            >
              Voltar para acompanhamento
            </Link>
          </div>
        </PageShell>
      );
    }
    notFound();
  }

  return (
    <PageShell
      title="Detalhes da atualização"
      maxWidth="lg"
    >
      <AdminAcompanhamentoDetalheClient detalhe={detalhe} />
    </PageShell>
  );
}
