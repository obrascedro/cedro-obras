"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { obterUrlFotoAcompanhamentoAdminAction } from "@/app/actions/admin-acompanhamento";
import AcompanhamentoFotoLazy from "@/app/components/acompanhamento/AcompanhamentoFotoLazy";
import AcompanhamentoGaleriaModal from "@/app/components/acompanhamento/AcompanhamentoGaleriaModal";
import { formatDataAtualizacao } from "@/lib/acompanhamento-obras/format";
import type { AcompanhamentoDetalhe } from "@/lib/acompanhamento-obras/types";

type AdminAcompanhamentoDetalheClientProps = {
  detalhe: AcompanhamentoDetalhe;
};

export default function AdminAcompanhamentoDetalheClient({
  detalhe,
}: AdminAcompanhamentoDetalheClientProps) {
  const [indiceGaleria, setIndiceGaleria] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Link
        href="/acompanhamento-obras"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="cedro-card space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {detalhe.obra_nome}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {detalhe.funcionario_nome}
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Etapa</dt>
            <dd className="mt-1 font-medium">{detalhe.etapa}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Data</dt>
            <dd className="mt-1">{formatDataAtualizacao(detalhe.data_atualizacao)}</dd>
          </div>
        </dl>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Observação do funcionário
          </h2>
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {detalhe.observacao_funcionario?.trim() ||
              "Nenhuma observação informada."}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Fotos ({detalhe.fotos.length})
          </h2>
          {detalhe.fotos.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma foto registrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {detalhe.fotos.map((foto, indice) => (
                <AcompanhamentoFotoLazy
                  key={foto.id}
                  foto={foto}
                  obterUrl={obterUrlFotoAcompanhamentoAdminAction}
                  onClick={() => setIndiceGaleria(indice)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {indiceGaleria !== null && detalhe.fotos.length > 0 ? (
        <AcompanhamentoGaleriaModal
          fotos={detalhe.fotos}
          titulo={`${detalhe.obra_nome} — ${detalhe.etapa}`}
          indiceInicial={indiceGaleria}
          onFechar={() => setIndiceGaleria(null)}
          obterUrl={obterUrlFotoAcompanhamentoAdminAction}
        />
      ) : null}
    </div>
  );
}
