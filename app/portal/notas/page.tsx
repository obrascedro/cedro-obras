import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPortalNotasAccessCode } from "@/lib/portal-notas/config";
import { listarFuncionariosPortalAtivos } from "@/lib/portal-notas/funcionarios";
import { obterSessaoPortalNotas } from "@/lib/portal-notas/session";
import PortalNotasApp from "@/app/components/portal-notas/PortalNotasApp";
import PortalNotasLogin from "@/app/components/portal-notas/PortalNotasLogin";
import type { ObraOption } from "@/lib/notas-fiscais";

export const metadata: Metadata = {
  title: "Portal de Notas — Cedro Obras",
  description: "Envio de notas fiscais pelos funcionários",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalNotasPage() {
  const configurado = Boolean(getPortalNotasAccessCode());
  const sessao = configurado ? await obterSessaoPortalNotas() : null;

  if (!configurado) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Portal indisponível. O administrador precisa configurar{" "}
          <code className="font-mono">PORTAL_NOTAS_ACCESS_CODE</code> no
          servidor.
        </p>
      </main>
    );
  }

  if (!sessao) {
    const supabase = createSupabaseServerClient();
    const funcionarios = await listarFuncionariosPortalAtivos(supabase);
    return <PortalNotasLogin funcionarios={funcionarios} />;
  }

  const supabase = createSupabaseServerClient();
  const { data: obras } = await supabase
    .from("obras")
    .select("id, nome")
    .order("nome");

  return (
    <PortalNotasApp
      nomeFuncionario={sessao.nome}
      obras={(obras ?? []) as ObraOption[]}
    />
  );
}
