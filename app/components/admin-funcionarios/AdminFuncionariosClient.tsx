"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  alternarAtivoFuncionarioAdminAction,
  atualizarFuncionarioAdminAction,
  criarFuncionarioAdminAction,
  redefinirSenhaFuncionarioAdminAction,
  type AdminFuncionariosState,
} from "@/app/actions/admin-funcionarios";
import FuncionarioObrasAutorizadas from "@/app/components/admin-funcionarios/FuncionarioObrasAutorizadas";
import {
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import { ADMIN_ROLE, FUNCIONARIO_ROLE } from "@/lib/auth-constants";
import {
  formatRoleLabel,
  type UsuarioAdmin,
} from "@/lib/admin-usuarios";

type AdminFuncionariosClientProps = {
  usuarios: UsuarioAdmin[];
};

const initialState: AdminFuncionariosState = {};

export default function AdminFuncionariosClient({
  usuarios,
}: AdminFuncionariosClientProps) {
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<"criar" | "editar" | null>(null);
  const [selecionado, setSelecionado] = useState<UsuarioAdmin | null>(null);
  const [feedback, setFeedback] = useState<AdminFuncionariosState>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo)
    );
  }, [usuarios, busca]);

  function abrirCriar() {
    setSelecionado(null);
    setModal("criar");
    setFeedback({});
  }

  function abrirEditar(usuario: UsuarioAdmin) {
    setSelecionado(usuario);
    setModal("editar");
    setFeedback({});
  }

  function fecharModal() {
    setModal(null);
    setSelecionado(null);
  }

  function handleAction(
    action: (
      prev: AdminFuncionariosState,
      formData: FormData
    ) => Promise<AdminFuncionariosState>,
    formData: FormData
  ) {
    startTransition(async () => {
      const result = await action(initialState, formData);
      setFeedback(result);
      if (result.sucesso) {
        router.refresh();
        if (modal === "criar") {
          fecharModal();
        }
      }
    });
  }

  function handleToggleAtivo(usuario: UsuarioAdmin) {
    startTransition(async () => {
      const result = await alternarAtivoFuncionarioAdminAction(usuario.id);
      setFeedback(result);
      if (result.sucesso) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {feedback.erro ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {feedback.erro}
        </p>
      ) : null}
      {feedback.sucesso ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {feedback.sucesso}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por nome ou e-mail…"
          className={`max-w-md ${inputClassName}`}
          aria-label="Pesquisar funcionários"
        />
        <button
          type="button"
          onClick={abrirCriar}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Novo usuário
        </button>
      </div>

      <div className="cedro-card overflow-hidden">
        <div className="cedro-table-wrap">
          <table className="cedro-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Perfil</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {usuario.nome}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {usuario.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        usuario.role === ADMIN_ROLE
                          ? "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-300"
                          : "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {formatRoleLabel(usuario.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        usuario.ativo
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(usuario)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggleAtivo(usuario)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        {usuario.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        {filtrados.length} de {usuarios.length} usuário(s)
      </p>

      {modal === "criar" ? (
        <Modal titulo="Novo usuário" onFechar={fecharModal}>
          <form
            action={(fd) => handleAction(criarFuncionarioAdminAction, fd)}
            className="space-y-4"
          >
            <Campo label="Nome" name="nome" required />
            <Campo label="E-mail" name="email" type="email" required />
            <Campo
              label="Senha temporária"
              name="senha"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
            <div>
              <label htmlFor="role-criar" className={labelClassName}>
                Perfil
              </label>
              <select
                id="role-criar"
                name="role"
                required
                defaultValue={FUNCIONARIO_ROLE}
                className={`mt-1.5 ${selectClassName}`}
              >
                <option value={FUNCIONARIO_ROLE}>Funcionário</option>
                <option value={ADMIN_ROLE}>Administrador</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {pending ? "Criando…" : "Criar usuário"}
              </button>
              <button
                type="button"
                onClick={fecharModal}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium dark:border-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal === "editar" && selecionado ? (
        <Modal titulo={`Editar — ${selecionado.nome}`} onFechar={fecharModal}>
          <form
            action={(fd) =>
              handleAction(atualizarFuncionarioAdminAction, fd)
            }
            className="space-y-4"
          >
            <input type="hidden" name="userId" value={selecionado.id} />
            <Campo
              label="Nome"
              name="nome"
              required
              defaultValue={selecionado.nome}
            />
            <Campo
              label="E-mail"
              name="email"
              type="email"
              required
              defaultValue={selecionado.email}
            />
            <div>
              <label htmlFor="role-editar" className={labelClassName}>
                Perfil
              </label>
              <select
                id="role-editar"
                name="role"
                required
                defaultValue={selecionado.role}
                className={`mt-1.5 ${selectClassName}`}
              >
                <option value={FUNCIONARIO_ROLE}>Funcionário</option>
                <option value={ADMIN_ROLE}>Administrador</option>
              </select>
            </div>
            <input
              type="hidden"
              name="ativo"
              value={selecionado.ativo ? "true" : "false"}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {pending ? "Salvando…" : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={fecharModal}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium dark:border-zinc-700"
              >
                Fechar
              </button>
            </div>
          </form>

          <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

          <FuncionarioObrasAutorizadas
            usuario={selecionado}
            onFeedback={setFeedback}
          />

          <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

          <form
            action={(fd) =>
              handleAction(redefinirSenhaFuncionarioAdminAction, fd)
            }
            className="space-y-3"
          >
            <input type="hidden" name="userId" value={selecionado.id} />
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Redefinir senha
            </p>
            <Campo
              label="Nova senha"
              name="senha"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {pending ? "Redefinindo…" : "Redefinir senha"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id="modal-titulo"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  minLength?: number;
}) {
  const id = `campo-${name}`;
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        minLength={minLength}
        className={`mt-1.5 ${inputClassName}`}
      />
    </div>
  );
}
