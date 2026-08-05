import PageShell from "@/app/components/PageShell";
import ClienteForm from "@/app/components/ClienteForm";

export default function ClientesPage() {
  return (
    <PageShell
      title="Cadastro de Cliente"
      description="Preencha os dados abaixo para cadastrar um novo cliente."
      maxWidth="md"
    >
      <div className="cedro-card p-6 sm:p-8">
        <ClienteForm />
      </div>
    </PageShell>
  );
}
