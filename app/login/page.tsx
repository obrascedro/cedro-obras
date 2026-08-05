import LoginForm from "@/app/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ erro?: string; next?: string }>;
};

const ERROS: Record<string, string> = {
  inativo: "Conta inativa ou sem permissão de acesso.",
  "auth-callback": "Não foi possível concluir a autenticação. Tente novamente.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const erroInicial = params.erro ? ERROS[params.erro] : undefined;
  const nextPath =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  return <LoginForm erroInicial={erroInicial} nextPath={nextPath} />;
}
