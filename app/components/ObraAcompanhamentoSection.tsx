import Link from "next/link";
import { Camera } from "lucide-react";
import {
  formatDataAtualizacao,
  formatDataHoraEnvio,
  resumirObservacao,
} from "@/lib/acompanhamento-obras/format";
import type { AcompanhamentoResumo } from "@/lib/acompanhamento-obras/types";

type ObraAcompanhamentoSectionProps = {
  itens: AcompanhamentoResumo[];
  obraId: string;
};

export default function ObraAcompanhamentoSection({
  itens,
  obraId,
}: ObraAcompanhamentoSectionProps) {
  return (
    <section className="cedro-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Acompanhamento
          </h2>
          <p className="text-sm text-zinc-500">
            Histórico de atualizações enviadas pelos funcionários.
          </p>
        </div>
        <Link
          href={`/acompanhamento-obras?obra=${obraId}`}
          className="text-sm font-medium text-[var(--cedro-brown)] hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhuma atualização registrada para esta obra.
        </p>
      ) : (
        <ul className="space-y-4">
          {itens.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatDataAtualizacao(item.data_atualizacao)} — {item.etapa}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {item.funcionario_nome}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                  <Camera className="h-3.5 w-3.5" />
                  {item.total_fotos} foto{item.total_fotos === 1 ? "" : "s"}
                </span>
              </div>
              {item.observacao_funcionario?.trim() ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {resumirObservacao(item.observacao_funcionario)}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-zinc-400">
                Enviado {formatDataHoraEnvio(item.criado_em)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
