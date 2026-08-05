import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import PortalNotasLoading from "@/app/components/portal-notas/PortalNotasLoading";
import PortalNotasObrasSection from "@/app/components/portal-notas/PortalNotasObrasSection";
import PortalPageLayout from "@/app/components/portal-notas/PortalPageLayout";
import PortalWarningBanner from "@/app/components/portal-notas/PortalWarningBanner";
import { getAppSession, LOGIN_PATH } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Portal de Notas — Cedro Projetos e Construções",
  description: "Envio de notas fiscais pelos funcionários",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalNotasPage() {
  const session = await getAppSession();

  if (!session) {
    redirect(LOGIN_PATH);
  }

  if (session.role === "funcionario" && !session.funcionario_id) {
    return (
      <PortalPageLayout
        nomeFuncionario={session.nome}
        activePath="/portal/notas"
        alert={
          <PortalWarningBanner
            title="Perfil incompleto."
            description="Peça ao administrador para vincular sua conta ao cadastro de funcionário."
          />
        }
      >
        <div />
      </PortalPageLayout>
    );
  }

  const funcionarioId = session.funcionario_id;

  return (
    <PortalPageLayout
      nomeFuncionario={session.nome}
      activePath="/portal/notas"
    >
      {funcionarioId ? (
        <Suspense fallback={<PortalNotasLoading />}>
          <PortalNotasObrasSection funcionarioId={funcionarioId} />
        </Suspense>
      ) : (
        <PortalNotasObrasSection funcionarioId="" />
      )}
    </PortalPageLayout>
  );
}
