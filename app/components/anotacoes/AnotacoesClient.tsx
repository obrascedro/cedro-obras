"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  atualizarAnotacaoPessoalAction,
  criarAnotacaoPessoalAction,
  excluirAnotacaoPessoalAction,
} from "@/app/actions/anotacoes-pessoais";
import AnotacaoModal from "@/app/components/anotacoes/AnotacaoModal";
import { btnPrimarySmClassName, inputClassName } from "@/app/components/ui/form-styles";
import {
  filtrarAnotacoesPessoais,
  listarCategoriasExtrasAnotacao,
  somarValoresAnotacoes,
  type AnotacaoPessoalRow,
} from "@/lib/anotacoes-pessoais";
import { formatCurrency, formatDate } from "@/lib/format";

type Ordenacao = "recentes" | "antigos" | "maior_valor" | "menor_valor";

type AnotacoesClientProps = {
  anotacoesIniciais: AnotacaoPessoalRow[];
};

export default function AnotacoesClient({
  anotacoesIniciais,
}: AnotacoesClientProps) {
  const router = useRouter();
  const [modal, setModal] = useState<"criar" | "editar" | null>(null);
  const [editando, setEditando] = useState<AnotacaoPessoalRow | null>(null);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");
  const [pending, startTransition] = useTransition();

  const categoriasExtras = useMemo(
    () => listarCategoriasExtrasAnotacao(anotacoesIniciais),
    [anotacoesIniciais]
  );

  const anotacoesFiltradas = useMemo(
    () =>
      filtrarAnotacoesPessoais(anotacoesIniciais, {
        busca,
        categoria: categoriaSelecionada,
        dataInicio,
        dataFim,
        ordenacao,
      }),
    [anotacoesIniciais, busca, categoriaSelecionada, dataInicio, dataFim, ordenacao]
  );

  const totalFiltrado = somarValoresAnotacoes(anotacoesFiltradas);

  function abrirCriar() {
    setEditando(null);
    setModal("criar");
  }

  function abrirEditar(anotacao: AnotacaoPessoalRow) {
    setEditando(anotacao);
    setModal("editar");
  }

  function fecharModal() {
    setModal(null);
    setEditando(null);
  }

  function handleSucesso() {
    router.refresh();
  }

  function handleExcluir(anotacao: AnotacaoPessoalRow) {
    const confirmado = window.confirm(
      "Deseja realmente excluir esta anotação?"
    );
    if (!confirmado) return;

    startTransition(async () => {
      const result = await excluirAnotacaoPessoalAction(anotacao.id);
      if (result.erro) {
        alert(result.erro);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="cedro-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Total anotado
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--cedro-text)]">
              {formatCurrency(totalFiltrado)}
            </p>
            <p className="mt-2 text-sm text-[var(--cedro-text-muted)]">
              {anotacoesFiltradas.length}{" "}
              {anotacoesFiltradas.length === 1 ? "anotação" : "anotações"}
            </p>
          </div>

          <button
            type="button"
            onClick={abrirCriar}
            className={btnPrimarySmClassName}
          >
            Nova anotação
          </button>
        </div>
      </div>

      <div className="cedro-card p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label
              htmlFor="busca-anotacao"
              className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
            >
              Buscar descrição
            </label>
            <input
              id="busca-anotacao"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: empréstimo"
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="filtro-categoria-anotacao"
              className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
            >
              Categoria
            </label>
            <select
              id="filtro-categoria-anotacao"
              name="filtro-categoria-anotacao"
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              autoComplete="off"
              style={{ WebkitAppearance: "menulist", appearance: "auto" }}
              className={`${inputClassName} cursor-pointer bg-white`}
            >
              <option value="">Todas</option>
              <option value="Pessoal">Pessoal</option>
              <option value="A receber">A receber</option>
              <option value="A pagar">A pagar</option>
              <option value="Empréstimo">Empréstimo</option>
              <option value="Lembrete">Lembrete</option>
              <option value="Pagos">Pagos</option>
              <option value="Outros">Outros</option>
              {categoriasExtras.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-inicio-anotacao"
              className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
            >
              De
            </label>
            <input
              id="filtro-inicio-anotacao"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="filtro-fim-anotacao"
              className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
            >
              Até
            </label>
            <input
              id="filtro-fim-anotacao"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="ordenacao-anotacao"
              className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
            >
              Ordenar
            </label>
            <select
              id="ordenacao-anotacao"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
              style={{ WebkitAppearance: "menulist", appearance: "auto" }}
              className={`${inputClassName} cursor-pointer bg-white`}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="maior_valor">Maior valor</option>
              <option value="menor_valor">Menor valor</option>
            </select>
          </div>
        </div>
      </div>

      {anotacoesIniciais.length === 0 ? (
        <div className="cedro-card border-dashed p-10 text-center">
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Nenhuma anotação cadastrada ainda.
          </p>
          <button
            type="button"
            onClick={abrirCriar}
            className={`${btnPrimarySmClassName} mt-4`}
          >
            Nova anotação
          </button>
        </div>
      ) : anotacoesFiltradas.length === 0 ? (
        <div className="cedro-card border-dashed p-10 text-center">
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Nenhuma anotação corresponde aos filtros selecionados.
          </p>
        </div>
      ) : (
        <>
          <div className="cedro-card hidden overflow-hidden md:block">
            <div className="cedro-table-wrap">
              <table className="cedro-table">
                <thead>
                  <tr>
                    {[
                      "Data",
                      "Descrição",
                      "Categoria",
                      "Valor",
                      "Observação",
                      "Ações",
                    ].map((header) => (
                      <th key={header} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anotacoesFiltradas.map((anotacao) => (
                    <tr key={anotacao.id}>
                      <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                        {formatDate(anotacao.data)}
                      </td>
                      <td className="font-medium text-[var(--cedro-text)]">
                        {anotacao.descricao}
                      </td>
                      <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                        {anotacao.categoria ?? "—"}
                      </td>
                      <td className="whitespace-nowrap font-medium">
                        {anotacao.valor != null
                          ? formatCurrency(anotacao.valor)
                          : "—"}
                      </td>
                      <td className="max-w-xs truncate text-[var(--cedro-text-muted)]">
                        {anotacao.observacao ?? "—"}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEditar(anotacao)}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Editar anotação"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleExcluir(anotacao)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label="Excluir anotação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {anotacoesFiltradas.map((anotacao) => (
              <li key={anotacao.id} className="cedro-card space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--cedro-text-muted)]">
                      {formatDate(anotacao.data)}
                    </p>
                    <p className="mt-1 font-medium text-[var(--cedro-text)]">
                      {anotacao.descricao}
                    </p>
                    {anotacao.categoria ? (
                      <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
                        {anotacao.categoria}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-semibold text-[var(--cedro-text)]">
                    {anotacao.valor != null
                      ? formatCurrency(anotacao.valor)
                      : "—"}
                  </p>
                </div>

                {anotacao.observacao ? (
                  <p className="text-sm text-[var(--cedro-text-muted)]">
                    {anotacao.observacao}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEditar(anotacao)}
                    className="cedro-btn-secondary flex-1 px-3 py-2 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleExcluir(anotacao)}
                    className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {modal === "criar" ? (
        <AnotacaoModal
          modo="criar"
          onFechar={fecharModal}
          onSalvar={criarAnotacaoPessoalAction}
          onSucesso={handleSucesso}
        />
      ) : null}

      {modal === "editar" && editando ? (
        <AnotacaoModal
          modo="editar"
          anotacao={editando}
          onFechar={fecharModal}
          onSalvar={(fd) => atualizarAnotacaoPessoalAction(editando.id, fd)}
          onSucesso={handleSucesso}
        />
      ) : null}
    </div>
  );
}
