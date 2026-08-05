"use client";

import { useActionState } from "react";
import {
  portalNotasLoginAction,
  type PortalNotasLoginState,
} from "@/app/actions/portal-notas";
import {
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import type { PortalFuncionario } from "@/lib/portal-notas/funcionarios";

const initialState: PortalNotasLoginState = {};

type PortalNotasLoginProps = {
  funcionarios: PortalFuncionario[];
};

export default function PortalNotasLogin({
  funcionarios,
}: PortalNotasLoginProps) {
  const [state, formAction, pending] = useActionState(
    portalNotasLoginAction,
    initialState
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <header className="mb-8 text-center">
        <p className="text-xs font-semibold tracking-widest text-emerald-600 uppercase">
          Cedro Obras
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Portal de Envio de Notas
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Acesso exclusivo para funcionários autorizados
        </p>
      </header>

      {funcionarios.length === 0 ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nenhum funcionário autorizado cadastrado. Execute{" "}
          <code className="font-mono">supabase/portal-funcionarios.sql</code> no
          Supabase.
        </p>
      ) : (
        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <label htmlFor="funcionarioId" className={labelClassName}>
              Funcionário
            </label>
            <select
              id="funcionarioId"
              name="funcionarioId"
              required
              defaultValue=""
              className={`mt-1.5 ${selectClassName}`}
            >
              <option value="" disabled>
                Selecione seu nome
              </option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="senha" className={labelClassName}>
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Senha de acesso"
              className={`mt-1.5 ${inputClassName}`}
            />
          </div>

          {state.erro ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
              {state.erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}
    </main>
  );
}
