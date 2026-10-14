import AppLayout from "@/app/components/layout/AppLayout";
import PageHeader from "@/app/components/ui/PageHeader";
import { ADMIN_ROLE, getAppSession } from "@/lib/auth";
import { contarNotasPendentesParaLayout } from "@/lib/notas-pendentes-admin";

type PageShellProps = {
  title: string;
  description?: string;
  greeting?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "md" | "lg" | "xl" | "full";
  hidePageHeader?: boolean;
};

const maxWidthClass = {
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
  full: "max-w-[1600px]",
};

export default async function PageShell({
  title,
  description,
  greeting,
  action,
  children,
  maxWidth = "lg",
  hidePageHeader = false,
}: PageShellProps) {
  const session = await getAppSession();
  const notasPendentes = await contarNotasPendentesParaLayout(session?.role);

  return (
    <AppLayout
      nomeUsuario={session?.nome}
      isAdmin={session?.role === ADMIN_ROLE && session.ativo}
      notasPendentes={notasPendentes}
      pageTitle={title}
    >
      <main
        className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${maxWidthClass[maxWidth]}`}
      >
        {!hidePageHeader ? (
          <PageHeader
            title={title}
            description={description}
            greeting={greeting}
            action={action}
          />
        ) : null}
        {children}
      </main>
    </AppLayout>
  );
}
