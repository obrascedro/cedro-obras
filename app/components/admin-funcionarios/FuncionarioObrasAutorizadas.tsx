"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listarObrasAutorizadasFuncionarioAdminAction,
  listarObrasDisponiveisAdminAction,
  salvarObrasAutorizadasFuncionarioAdminAction,
} from "@/app/actions/admin-funcionario-obras";
import type { AdminFuncionariosState } from "@/app/actions/admin-funcionarios";
import type { ObraAdminOption } from "@/lib/admin-funcionario-obras";
import type { UsuarioAdmin } from "@/lib/admin-usuarios";
import { FUNCIONARIO_ROLE } from "@/lib/auth-constants";

type FuncionarioObrasAutorizadasProps = {
  usuario: UsuarioAdmin;
  onFeedback: (state: AdminFuncionariosState) => void;
};

export default function FuncionarioObrasAutorizadas({
  usuario,
  onFeedback,
}: FuncionarioObrasAutorizadasProps) {
  const [obras, setObras] = useState<ObraAdminOption[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [confirmarRemocaoTotal, setConfirmarRemocaoTotal] = useState(false);
  const [pending, startTransition] = useTransition();

  const funcionarioId = usuario.funcionario_id;
  const exibirSecao =
    usuario.role === FUNCIONARIO_ROLE && Boolean(funcionarioId);

  useEffect(() => {
    if (!exibirSecao || !funcionarioId) {
      return;
    }

    let cancelado = false;

    async function carregar() {
      if (!funcionarioId) return;

      setErroCarregamento(null);
      setConfirmarRemocaoTotal(false);

      try {
        setCarregando(true);
        const [listaObras, autorizadas] = await Promise.all([
          listarObrasDisponiveisAdminAction(),
          listarObrasAutorizadasFuncionarioAdminAction(funcionarioId),
        ]);

        if (cancelado) return;

        setObras(listaObras);
        setSelecionadas(new Set(autorizadas));
      } catch (error) {
        if (cancelado) return;
        setErroCarregamento(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as obras."
        );
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [exibirSecao, funcionarioId]);

  if (!exibirSecao) {
    if (usuario.role !== FUNCIONARIO_ROLE) {
      return (
        <p className="text-sm text-zinc-500">
          Obras autorizadas aplicam-se apenas a usuários com perfil Funcionário.
        </p>
      );
    }
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400">
        Salve o cadastro com perfil Funcionário para vincular obras.
      </p>
    );
  }

  function toggleObra(obraId: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(obraId)) {
        next.delete(obraId);
      } else {
        next.add(obraId);
      }
      return next;
    });
    setConfirmarRemocaoTotal(false);
  }

  function handleSalvar(formData: FormData) {
    if (selecionadas.size === 0 && !confirmarRemocaoTotal) {
      onFeedback({
        erro:
          "Marque a confirmação abaixo para remover todos os acessos às obras.",
      });
      return;
    }

    for (const obraId of selecionadas) {
      formData.append("obraIds", obraId);
    }

    if (confirmarRemocaoTotal) {
      formData.set("confirmarRemocaoTotal", "true");
    }

    startTransition(async () => {
      const result = await salvarObrasAutorizadasFuncionarioAdminAction(
        {},
        formData
      );
      onFeedback(result);
      if (result.sucesso && funcionarioId) {
        const autorizadas =
          await listarObrasAutorizadasFuncionarioAdminAction(funcionarioId);
        setSelecionadas(new Set(autorizadas));
        setConfirmarRemocaoTotal(false);
      }
    });
  }

  const nenhumaSelecionada = selecionadas.size === 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Obras autorizadas
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Selecione as obras em que este funcionário pode enviar notas fiscais.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-zinc-500" aria-busy="true">
          Carregando obras…
        </p>
      ) : erroCarregamento ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {erroCarregamento}
        </p>
      ) : obras.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhuma obra ativa cadastrada no sistema.
        </p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          {obras.map((obra) => {
            const checked = selecionadas.has(obra.id);
            const inputId = `obra-${obra.id}`;
            return (
              <li key={obra.id}>
                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleObra(obra.id)}
                    disabled={pending}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {obra.nome}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {obra.status}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {nenhumaSelecionada && obras.length > 0 && !carregando ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <input
            type="checkbox"
            checked={confirmarRemocaoTotal}
            onChange={(e) => setConfirmarRemocaoTotal(e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-amber-400"
          />
          <span>
            Confirmo remover todos os acessos às obras deste funcionário.
          </span>
        </label>
      ) : null}

      <form action={handleSalvar}>
        <input type="hidden" name="userId" value={usuario.id} />
        <input type="hidden" name="funcionarioId" value={funcionarioId ?? ""} />
        <button
          type="submit"
          disabled={pending || carregando || Boolean(erroCarregamento)}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Salvando obras…" : "Salvar obras autorizadas"}
        </button>
      </form>
    </div>
  );
}
