"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import CedroLogo from "@/app/components/brand/CedroLogo";
import {
  btnPrimaryClassName,
  cardClassName,
  inputClassName,
  labelClassName,
} from "@/app/components/ui/form-styles";
import { APP_TAGLINE } from "@/lib/brand";

const initialState: LoginState = {};

type LoginFormProps = {
  erroInicial?: string;
  nextPath?: string;
};

function ConstructionPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      aria-hidden
    >
      <svg className="h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        <path fill="white" d="M40 320h80v60H40zm120 0h60v80h-60zm100-40h70v120h-70zM200 200h50v50h-50zm-80-60h40v100h-40z" />
        <path fill="none" stroke="white" strokeWidth="2" d="M20 340h360M100 280v60M260 240v100" />
      </svg>
    </div>
  );
}

export default function LoginForm({ erroInicial, nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    erroInicial ? { erro: erroInicial } : initialState
  );

  return (
    <div className="min-h-dvh bg-[var(--cedro-bg)] lg:grid lg:grid-cols-2">
      {/* Painel institucional — desktop */}
      <aside className="relative hidden flex-col justify-center overflow-hidden bg-[var(--cedro-brown)] px-10 py-12 text-white lg:flex xl:px-16">
        <ConstructionPattern />
        <div className="relative z-10 mx-auto w-full max-w-md">
          <CedroLogo variant="login" priority className="brightness-0 invert" />
          <p className="mt-8 text-lg leading-relaxed text-white/90">
            {APP_TAGLINE}
          </p>
          <p className="mt-4 text-sm text-white/70">
            Acesse com seu e-mail corporativo para continuar.
          </p>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-8">
        <div className="mb-6 lg:hidden">
          <CedroLogo variant="login" priority />
        </div>

        <form
          action={formAction}
          className={`${cardClassName} w-full max-w-md space-y-5 p-6 sm:p-8`}
        >
          <div className="mb-2 hidden lg:block">
            <h1 className="text-xl font-semibold text-[var(--cedro-text)]">
              Acesse sua conta
            </h1>
            <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
              Entre com suas credenciais de acesso.
            </p>
          </div>

          {nextPath ? (
            <input type="hidden" name="next" value={nextPath} />
          ) : null}

          <div>
            <label htmlFor="usuario" className={labelClassName}>
              Usuário
            </label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              required
              autoComplete="username"
              placeholder="seu@email.com"
              className={`mt-1.5 ${inputClassName}`}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClassName}>
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Senha de acesso"
              className={`mt-1.5 ${inputClassName}`}
            />
          </div>

          {state.erro ? (
            <p
              className="rounded-xl px-3 py-2 text-sm text-[var(--cedro-error)]"
              style={{ background: "var(--cedro-error-bg)" }}
              role="alert"
            >
              {state.erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={btnPrimaryClassName}
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
