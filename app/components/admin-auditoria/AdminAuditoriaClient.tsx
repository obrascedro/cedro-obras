"use client";

import { useMemo, useState, useTransition } from "react";
import {
  exportarAuditoriaCsvAction,
  listarAuditoriaAdminAction,
  type AuditoriaFiltros,
} from "@/app/actions/admin-auditoria";
import {
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import { AUDIT_MODULOS, type AuditLogRow } from "@/lib/audit-constants";
import { ADMIN_ROLE, FUNCIONARIO_ROLE } from "@/lib/auth-constants";
import { formatRoleLabel } from "@/lib/admin-usuarios";

type AdminAuditoriaClientProps = {
  logsIniciais: AuditLogRow[];
  usuarios: { id: string; nome: string }[];
  acoes: string[];
};

const MODULO_LABELS: Record<string, string> = {
  auth: "Autenticação",
  funcionarios: "Funcionários",
  notas_fiscais: "Notas fiscais",
  financeiro: "Financeiro",
  obras: "Obras",
  clientes: "Clientes",
  configuracoes: "Configurações",
};

function formatModulo(modulo: string): string {
  return MODULO_LABELS[modulo] ?? modulo;
}

function formatDataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAuditoriaClient({
  logsIniciais,
  usuarios,
  acoes,
}: AdminAuditoriaClientProps) {
  const [logs, setLogs] = useState(logsIniciais);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState(hojeIso());
  const [usuarioId, setUsuarioId] = useState("");
  const [modulo, setModulo] = useState("");
  const [acao, setAcao] = useState("");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [pending, startTransition] = useTransition();

  const acoesFiltradas = useMemo(() => {
    if (!modulo) return acoes;
    return acoes;
  }, [acoes, modulo]);

  function montarFiltros(): AuditoriaFiltros {
    return {
      de: de || undefined,
      ate: ate || undefined,
      usuarioId: usuarioId || undefined,
      modulo: modulo || undefined,
      acao: acao || undefined,
      busca: busca || undefined,
    };
  }

  function aplicarFiltros() {
    startTransition(async () => {
      setErro("");
      try {
        const resultado = await listarAuditoriaAdminAction(montarFiltros());
        setLogs(resultado);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao carregar logs."
        );
      }
    });
  }

  function limparFiltros() {
    setDe("");
    setAte(hojeIso());
    setUsuarioId("");
    setModulo("");
    setAcao("");
    setBusca("");
    startTransition(async () => {
      setErro("");
      try {
        const resultado = await listarAuditoriaAdminAction();
        setLogs(resultado);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao carregar logs."
        );
      }
    });
  }

  function exportarCsv() {
    startTransition(async () => {
      setErro("");
      try {
        const csv = await exportarAuditoriaCsvAction(montarFiltros());
        const blob = new Blob(["\uFEFF" + csv], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao exportar CSV."
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-de" className={labelClassName}>
              De
            </label>
            <input
              id="filtro-de"
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-ate" className={labelClassName}>
              Até
            </label>
            <input
              id="filtro-ate"
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-usuario" className={labelClassName}>
              Usuário
            </label>
            <select
              id="filtro-usuario"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              className={selectClassName}
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-modulo" className={labelClassName}>
              Módulo
            </label>
            <select
              id="filtro-modulo"
              value={modulo}
              onChange={(e) => {
                setModulo(e.target.value);
                setAcao("");
              }}
              className={selectClassName}
            >
              <option value="">Todos</option>
              {AUDIT_MODULOS.map((m) => (
                <option key={m} value={m}>
                  {formatModulo(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-acao" className={labelClassName}>
              Ação
            </label>
            <select
              id="filtro-acao"
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              className={selectClassName}
            >
              <option value="">Todas</option>
              {acoesFiltradas.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 xl:col-span-1">
            <label htmlFor="filtro-busca" className={labelClassName}>
              Busca
            </label>
            <input
              id="filtro-busca"
              type="search"
              placeholder="Texto na descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={aplicarFiltros}
              disabled={pending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
            >
              {pending ? "Carregando..." : "Filtrar"}
            </button>
            <button
              type="button"
              onClick={limparFiltros}
              disabled={pending}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Limpar
            </button>
          </div>

          <button
            type="button"
            onClick={exportarCsv}
            disabled={pending || logs.length === 0}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {erro ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {erro}
        </p>
      ) : null}

      <div className="cedro-card overflow-hidden">
        <div className="cedro-table-wrap">
          <table className="cedro-table">
            <thead>
              <tr>
                <th scope="col">Data/Hora</th>
                <th scope="col">Usuário</th>
                <th scope="col">Perfil</th>
                <th scope="col">Módulo</th>
                <th scope="col">Ação</th>
                <th scope="col">Descrição</th>
              </tr>
            </thead>
            <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-[var(--cedro-text-muted)]"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                    {formatDataHora(log.created_at)}
                  </td>
                  <td className="font-medium">
                    {log.usuario_nome}
                  </td>
                  <td className="text-[var(--cedro-text-muted)]">
                    {log.usuario_role === ADMIN_ROLE ||
                    log.usuario_role === FUNCIONARIO_ROLE
                      ? formatRoleLabel(log.usuario_role)
                      : log.usuario_role ?? "—"}
                  </td>
                  <td className="text-[var(--cedro-text-muted)]">
                    {formatModulo(log.modulo)}
                  </td>
                  <td className="capitalize text-[var(--cedro-text-muted)]">
                    {log.acao.replace(/_/g, " ")}
                  </td>
                  <td>
                    {log.descricao}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Exibindo até {logs.length} registros, da mais recente para a mais
        antiga.
      </p>
    </div>
  );
}
