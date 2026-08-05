import PageShell from "@/app/components/PageShell";
import FinanceiroModulos from "@/app/components/FinanceiroModulos";

export default function FinanceiroPage() {
  return (
    <PageShell
      title="Financeiro"
      description="Centralize compras, pagamentos, notas fiscais e relatórios financeiros."
      maxWidth="full"
    >
      <FinanceiroModulos />
    </PageShell>
  );
}
