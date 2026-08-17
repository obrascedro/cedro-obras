"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, FileText, Receipt } from "lucide-react";
import { obterUrlArquivoNotaAdminAction } from "@/app/actions/notas-fiscais-admin";
import { formatCurrency, formatDate } from "@/lib/format";
import type { LinhaFinanceiraEtapa } from "@/lib/obras/gastos-por-etapa-consulta";
import type { NotaFiscal } from "@/lib/notas-fiscais";
import {
  formatStatusLabel,
  statusNotaBadgeClass,
} from "@/lib/notas-fiscais-status";
import { inputClassName, selectClassName } from "@/app/components/ui/form-styles";

type Ordenacao = "recentes" | "antigos" | "maior_valor" | "menor_valor";

type ObraEtapaGastosClientProps = {
  obraId: string;
  obraNome: string;
  etapa: string;
  linhas: LinhaFinanceiraEtapa[];
  total: number;
};

function badgeTipoLinha(linha: LinhaFinanceiraEtapa) {
  if (linha.tipo === "nota_fiscal") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset dark:bg-blue-950/40 dark:text-blue-300">
        <Receipt className="h-3 w-3" aria-hidden />
        Nota fiscal
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-600/20 ring-inset dark:bg-zinc-800 dark:text-zinc-300">
      <FileText className="h-3 w-3" aria-hidden />
      Gasto manual
    </span>
  );
}

function NotaDetalheModal({
  nota,
  linha,
  onFechar,
}: {
  nota: NotaFiscal;
  linha: LinhaFinanceiraEtapa;
  onFechar: () => void;
}) {
  const [abrindoArquivo, setAbrindoArquivo] = useState(false);
  const [erro, setErro] = useState("");

  async function abrirArquivo() {
    setErro("");
    setAbrindoArquivo(true);

    const result = await obterUrlArquivoNotaAdminAction(nota.arquivo_path);

    setAbrindoArquivo(false);

    if ("erro" in result) {
      setErro(result.erro);
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nota-detalhe-titulo"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--cedro-border)] bg-[var(--cedro-surface)] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="nota-detalhe-titulo"
              className="text-lg font-semibold text-[var(--cedro-text)]"
            >
              Nota fiscal
            </h2>
            <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
              {nota.arquivo_nome}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-2 py-1 text-sm text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)]"
          >
            Fechar
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Fornecedor
            </dt>
            <dd className="mt-1 text-sm text-[var(--cedro-text)]">
              {linha.fornecedor ?? nota.fornecedor ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Valor (etapa)
            </dt>
            <dd className="mt-1 text-sm font-medium text-[var(--cedro-text)]">
              {formatCurrency(linha.valor)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Categoria
            </dt>
            <dd className="mt-1 text-sm text-[var(--cedro-text)]">
              {linha.categoria}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Etapa
            </dt>
            <dd className="mt-1 text-sm text-[var(--cedro-text)]">{linha.etapa}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Data
            </dt>
            <dd className="mt-1 text-sm text-[var(--cedro-text)]">
              {formatDate(linha.data)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Status
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusNotaBadgeClass(nota.status_processamento)}`}
              >
                {formatStatusLabel(nota.status_processamento)}
              </span>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase">
              Descrição
            </dt>
            <dd className="mt-1 text-sm text-[var(--cedro-text)]">
              {linha.descricao}
            </dd>
          </div>
        </dl>

        {erro ? (
          <p className="mt-4 text-sm text-[var(--cedro-error)]">{erro}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={abrirArquivo}
            disabled={abrindoArquivo}
            className="cedro-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {abrindoArquivo ? "Abrindo…" : "Ver comprovante"}
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="cedro-btn-secondary px-4 py-2.5 text-sm"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ObraEtapaGastosClient({
  obraId,
  obraNome,
  etapa,
  linhas,
  total,
}: ObraEtapaGastosClientProps) {
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [fornecedorFiltro, setFornecedorFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [notaAberta, setNotaAberta] = useState<{
    nota: NotaFiscal;
    linha: LinhaFinanceiraEtapa;
  } | null>(null);
  const [abrindoArquivoId, setAbrindoArquivoId] = useState<string | null>(null);

  const categorias = useMemo(
    () =>
      [...new Set(linhas.map((l) => l.categoria).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [linhas]
  );

  const fornecedores = useMemo(
    () =>
      [
        ...new Set(
          linhas.map((l) => l.fornecedor?.trim()).filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [linhas]
  );

  const linhasFiltradas = useMemo(() => {
    let resultado = [...linhas];

    if (categoriaFiltro) {
      resultado = resultado.filter((l) => l.categoria === categoriaFiltro);
    }

    if (fornecedorFiltro) {
      resultado = resultado.filter((l) => l.fornecedor === fornecedorFiltro);
    }

    if (dataInicio) {
      resultado = resultado.filter((l) => (l.data ?? "") >= dataInicio);
    }

    if (dataFim) {
      resultado = resultado.filter((l) => (l.data ?? "") <= dataFim);
    }

    switch (ordenacao) {
      case "antigos":
        resultado.sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
        break;
      case "maior_valor":
        resultado.sort((a, b) => b.valor - a.valor);
        break;
      case "menor_valor":
        resultado.sort((a, b) => a.valor - b.valor);
        break;
      default:
        resultado.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
    }

    return resultado;
  }, [linhas, categoriaFiltro, fornecedorFiltro, dataInicio, dataFim, ordenacao]);

  const totalFiltrado = useMemo(
    () => linhasFiltradas.reduce((sum, l) => sum + l.valor, 0),
    [linhasFiltradas]
  );

  async function abrirComprovante(linha: LinhaFinanceiraEtapa) {
    if (!linha.nota) return;

    setAbrindoArquivoId(linha.id);
    const result = await obterUrlArquivoNotaAdminAction(linha.nota.arquivo_path);
    setAbrindoArquivoId(null);

    if ("erro" in result) {
      alert(result.erro);
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  function abrirDetalheNota(linha: LinhaFinanceiraEtapa) {
    if (!linha.nota) return;
    setNotaAberta({ nota: linha.nota, linha });
  }

  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="Navegação"
        className="flex flex-wrap items-center gap-1 text-sm text-[var(--cedro-text-muted)]"
      >
        <Link
          href="/obras"
          className="transition-colors hover:text-[var(--cedro-text)]"
        >
          Obras
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <Link
          href={`/obras/${obraId}`}
          className="transition-colors hover:text-[var(--cedro-text)]"
        >
          {obraNome}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-medium text-[var(--cedro-text)]">{etapa}</span>
      </nav>

      <div className="cedro-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-[var(--cedro-text-muted)]">{obraNome}</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--cedro-text)]">
              Etapa: {etapa}
            </h2>
            <p className="mt-3 text-sm text-[var(--cedro-text-muted)]">
              <span className="font-medium text-[var(--cedro-text)]">
                {linhasFiltradas.length}
              </span>{" "}
              {linhasFiltradas.length === 1 ? "lançamento" : "lançamentos"}
              {linhasFiltradas.length !== linhas.length ? (
                <span> (de {linhas.length} no total)</span>
              ) : null}
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--cedro-text)]">
              Total: {formatCurrency(totalFiltrado)}
              {totalFiltrado !== total ? (
                <span className="ml-2 text-sm font-normal text-[var(--cedro-text-muted)]">
                  (filtrado de {formatCurrency(total)})
                </span>
              ) : null}
            </p>
          </div>

          <Link
            href={`/obras/${obraId}`}
            className="cedro-btn-secondary inline-flex items-center justify-center px-4 py-2.5 text-sm"
          >
            ← Voltar para a obra
          </Link>
        </div>
      </div>

      {linhas.length > 0 ? (
        <div className="cedro-card p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label
                htmlFor="ordenacao-etapa"
                className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
              >
                Ordenar
              </label>
              <select
                id="ordenacao-etapa"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                className={selectClassName}
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigos">Mais antigos</option>
                <option value="maior_valor">Maior valor</option>
                <option value="menor_valor">Menor valor</option>
              </select>
            </div>

            {categorias.length > 1 ? (
              <div>
                <label
                  htmlFor="filtro-categoria"
                  className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
                >
                  Categoria
                </label>
                <select
                  id="filtro-categoria"
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {fornecedores.length > 1 ? (
              <div>
                <label
                  htmlFor="filtro-fornecedor"
                  className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
                >
                  Fornecedor
                </label>
                <select
                  id="filtro-fornecedor"
                  value={fornecedorFiltro}
                  onChange={(e) => setFornecedorFiltro(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Todos</option>
                  {fornecedores.map((forn) => (
                    <option key={forn} value={forn}>
                      {forn}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="filtro-inicio"
                className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
              >
                De
              </label>
              <input
                id="filtro-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="filtro-fim"
                className="mb-1 block text-xs font-semibold tracking-wide text-[var(--cedro-text-muted)] uppercase"
              >
                Até
              </label>
              <input
                id="filtro-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      ) : null}

      {linhas.length === 0 ? (
        <div className="cedro-card border-dashed p-10 text-center">
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Não há gastos cadastrados nesta etapa.
          </p>
        </div>
      ) : linhasFiltradas.length === 0 ? (
        <div className="cedro-card border-dashed p-10 text-center">
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Nenhum lançamento corresponde aos filtros selecionados.
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
                      "Fornecedor",
                      "Categoria",
                      "Etapa",
                      "Valor",
                      "Status",
                      "Origem",
                      "Tipo",
                      "",
                    ].map((header) => (
                      <th key={header || "acoes"} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.map((linha) => (
                    <tr key={linha.id}>
                      <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                        {formatDate(linha.data)}
                      </td>
                      <td className="max-w-xs text-[var(--cedro-text)]">
                        {linha.descricao}
                      </td>
                      <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                        {linha.fornecedor ?? "—"}
                      </td>
                      <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                        {linha.categoria}
                      </td>
                      <td className="whitespace-nowrap font-medium">
                        {linha.etapa}
                      </td>
                      <td className="whitespace-nowrap font-medium">
                        {formatCurrency(linha.valor)}
                      </td>
                      <td className="whitespace-nowrap">
                        {linha.statusNota ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusNotaBadgeClass(linha.statusNota)}`}
                          >
                            {formatStatusLabel(linha.statusNota)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                        {linha.origem}
                      </td>
                      <td className="whitespace-nowrap">{badgeTipoLinha(linha)}</td>
                      <td className="whitespace-nowrap">
                        {linha.nota ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => abrirDetalheNota(linha)}
                              className="text-sm font-medium text-[var(--cedro-primary)] hover:underline"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              disabled={abrindoArquivoId === linha.id}
                              onClick={() => abrirComprovante(linha)}
                              className="text-sm font-medium text-[var(--cedro-text-muted)] hover:text-[var(--cedro-text)]"
                            >
                              {abrindoArquivoId === linha.id ? "…" : "Arquivo"}
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {linhasFiltradas.map((linha) => (
              <li
                key={linha.id}
                className="cedro-card space-y-3 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--cedro-text-muted)]">
                      {formatDate(linha.data)}
                    </p>
                    <p className="mt-1 font-medium text-[var(--cedro-text)]">
                      {linha.descricao}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-[var(--cedro-text)]">
                    {formatCurrency(linha.valor)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">{badgeTipoLinha(linha)}</div>

                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--cedro-text-muted)]">
                      Fornecedor
                    </dt>
                    <dd className="text-[var(--cedro-text)]">
                      {linha.fornecedor ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--cedro-text-muted)]">
                      Categoria
                    </dt>
                    <dd className="text-[var(--cedro-text)]">{linha.categoria}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--cedro-text-muted)]">Etapa</dt>
                    <dd className="text-[var(--cedro-text)]">{linha.etapa}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--cedro-text-muted)]">Origem</dt>
                    <dd className="text-[var(--cedro-text)]">{linha.origem}</dd>
                  </div>
                </dl>

                {linha.statusNota ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusNotaBadgeClass(linha.statusNota)}`}
                  >
                    {formatStatusLabel(linha.statusNota)}
                  </span>
                ) : null}

                {linha.nota ? (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => abrirDetalheNota(linha)}
                      className="cedro-btn-secondary flex-1 px-3 py-2 text-sm"
                    >
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      disabled={abrindoArquivoId === linha.id}
                      onClick={() => abrirComprovante(linha)}
                      className="cedro-btn-primary flex-1 px-3 py-2 text-sm"
                    >
                      {abrindoArquivoId === linha.id ? "Abrindo…" : "Comprovante"}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {notaAberta ? (
        <NotaDetalheModal
          nota={notaAberta.nota}
          linha={notaAberta.linha}
          onFechar={() => setNotaAberta(null)}
        />
      ) : null}
    </div>
  );
}
