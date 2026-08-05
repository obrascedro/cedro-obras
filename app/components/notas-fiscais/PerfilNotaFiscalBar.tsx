"use client";

import { useEffect, useState } from "react";
import {
  definirNomeUsuarioLocal,
  definirPerfilLocal,
  obterNomeUsuarioLocal,
  obterPerfilLocal,
  type PerfilNotaFiscal,
} from "@/lib/nota-fiscal-perfil";
import { inputClassName, selectClassName } from "@/app/components/ui/form-styles";

type PerfilNotaFiscalBarProps = {
  onChange?: (perfil: PerfilNotaFiscal, nome: string) => void;
};

export default function PerfilNotaFiscalBar({
  onChange,
}: PerfilNotaFiscalBarProps) {
  const [perfil, setPerfil] = useState<PerfilNotaFiscal>("funcionario");
  const [nome, setNome] = useState("Funcionário");

  useEffect(() => {
    setPerfil(obterPerfilLocal());
    setNome(obterNomeUsuarioLocal());
  }, []);

  function atualizar(novoPerfil: PerfilNotaFiscal, novoNome: string) {
    setPerfil(novoPerfil);
    setNome(novoNome);
    definirPerfilLocal(novoPerfil);
    definirNomeUsuarioLocal(novoNome);
    onChange?.(novoPerfil, novoNome);
  }

  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Perfil local (desenvolvimento)
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Autenticação real será integrada futuramente. Use este seletor para
        simular funcionário ou aprovador.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Seu nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => atualizar(perfil, e.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="sm:w-48">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Perfil
          </label>
          <select
            value={perfil}
            onChange={(e) =>
              atualizar(e.target.value as PerfilNotaFiscal, nome)
            }
            className={selectClassName}
          >
            <option value="funcionario">Funcionário</option>
            <option value="aprovador">Aprovador / Admin</option>
          </select>
        </div>
      </div>
      {perfil === "aprovador" ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Modo aprovador ativo — você pode aprovar, rejeitar ou solicitar
          correção nas pendências.
        </p>
      ) : null}
    </div>
  );
}
