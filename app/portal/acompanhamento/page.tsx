import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import PortalAcompanhamentoObrasSection from "@/app/components/portal-acompanhamento/PortalAcompanhamentoObrasSection";
import PortalNotasLoading from "@/app/components/portal-notas/PortalNotasLoading";
import PortalPageLayout from "@/app/components/portal-notas/PortalPageLayout";
import PortalWarningBanner from "@/app/components/portal-notas/PortalWarningBanner";
import { getAppSession, LOGIN_PATH } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Acompanhamento da obra — Cedro Projetos e Construções",
  description: "Envio de fotos e atualizações das obras",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalAcompanhamentoPage() {
  const session = await getAppSession();

  if (!session) {
    redirect(LOGIN_PATH);
  }

  if (session.role === "funcionario" && !session.funcionario_id) {
    return (
      <PortalPageLayout
        nomeFuncionario={session.nome}
        activePath="/portal/acompanhamento"
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
      activePath="/portal/acompanhamento"
    >
      {funcionarioId ? (
        <Suspense fallback={<PortalNotasLoading />}>
          <PortalAcompanhamentoObrasSection funcionarioId={funcionarioId} />
        </Suspense>
      ) : (
        <PortalWarningBanner
          title="Acesso restrito."
          description="Este módulo está disponível apenas para funcionários."
        />
      )}
    </PortalPageLayout>
  );
}
