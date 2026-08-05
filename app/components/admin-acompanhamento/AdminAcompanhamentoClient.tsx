"use client";

import { Camera, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  inputClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import { agruparAcompanhamentosPorEtapa } from "@/lib/acompanhamento-obras/agrupar-por-etapa";
import { ETAPAS_OBRA } from "@/lib/acompanhamento-obras/etapas";
import {
  formatDataAtualizacao,
  formatDataHoraEnvio,
  resumirObservacao,
} from "@/lib/acompanhamento-obras/format";
import type { AcompanhamentoResumo } from "@/lib/acompanhamento-obras/types";

type AdminAcompanhamentoClientProps = {
  inicial: AcompanhamentoResumo[];
  obras: { id: string; nome: string }[];
  funcionarios: { id: string; nome: string }[];
  obraInicial?: string;
};

function CardAtualizacao({ item }: { item: AcompanhamentoResumo }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {item.obra_nome}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {item.funcionario_nome}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <Camera className="h-3 w-3" />
          {item.total_fotos}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {formatDataAtualizacao(item.data_atualizacao)} · enviado{" "}
        {formatDataHoraEnvio(item.criado_em)}
      </p>
      {item.observacao_funcionario?.trim() ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {resumirObservacao(item.observacao_funcionario, 120)}
        </p>
      ) : (
        <p className="mt-2 text-sm italic text-zinc-400">Sem observação</p>
      )}
      <Link
        href={`/acompanhamento-obras/${item.id}`}
        className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Ver detalhes
      </Link>
    </article>
  );
}

export default function AdminAcompanhamentoClient({
  inicial,
  obras,
  funcionarios,
  obraInicial = "",
}: AdminAcompanhamentoClientProps) {
  const [itens] = useState(inicial);
  const [obraId, setObraId] = useState(obraInicial);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [etapa, setEtapa] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    let lista = [...itens];

    if (obraId) lista = lista.filter((i) => i.obra_id === obraId);
    if (funcionarioId) {
      lista = lista.filter((i) => i.funcionario_id === funcionarioId);
    }
    if (etapa) lista = lista.filter((i) => i.etapa_codigo === etapa);
    if (dataInicio) {
      lista = lista.filter((i) => i.data_atualizacao >= dataInicio);
    }
    if (dataFim) {
      lista = lista.filter((i) => i.data_atualizacao <= dataFim);
    }
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter((i) => {
        const obs = i.observacao_funcionario ?? i.observacao ?? "";
        return obs.toLowerCase().includes(termo);
      });
    }

    return lista;
  }, [itens, obraId, funcionarioId, etapa, dataInicio, dataFim, busca]);

  const grupos = useMemo(
    () => agruparAcompanhamentosPorEtapa(filtrados),
    [filtrados]
  );

  return (
    <div className="space-y-6">
      <div className="cedro-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Obra</label>
          <select
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Todas</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Funcionário</label>
          <select
            value={funcionarioId}
            onChange={(e) => setFuncionarioId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Etapa</label>
          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            className={selectClassName}
          >
            <option value="">Todas</option>
            {ETAPAS_OBRA.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Data início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Data fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Buscar na observação
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Texto da observação…"
              className={`pl-9 ${inputClassName}`}
            />
          </div>
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="cedro-card px-4 py-12 text-center text-sm text-zinc-500">
          Nenhuma atualização encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-8">
          {grupos.map((grupo) => (
            <section key={grupo.etapa}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                {grupo.etapa}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {grupo.itens.map((item) => (
                  <CardAtualizacao key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
