import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import ObraForm from "@/app/components/ObraForm";
import { listarClientesObraAdminAction } from "@/app/actions/obras-admin";

export const dynamic = "force-dynamic";

export default async function NovaObraPage() {
  const clientes = await listarClientesObraAdminAction();

  return (
    <PageShell
      title="Cadastro de Obra"
      description="Registre uma nova obra vinculada a um cliente."
      maxWidth="xl"
      action={
        <Link
          href="/obras"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para obras
        </Link>
      }
    >
      <ObraForm clientes={clientes} />
    </PageShell>
  );
}
