import PageShell from "@/app/components/PageShell";
import ClienteForm from "@/app/components/ClienteForm";

export default function ClientesPage() {
  return (
    <PageShell
      title="Cadastro de Cliente"
      description="Preencha os dados abaixo para cadastrar um novo cliente."
      maxWidth="md"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <ClienteForm />
      </div>
    </PageShell>
  );
}
