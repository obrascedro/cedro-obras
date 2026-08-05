"use client";

import { Camera, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { listarAcompanhamentosPortalAction } from "@/app/actions/portal-acompanhamento";
import { portalCardClassName } from "@/app/components/ui/form-styles";
import {
  formatDataAtualizacao,
  formatDataHoraEnvio,
  resumirObservacao,
} from "@/lib/acompanhamento-obras/format";
import type { AcompanhamentoResumo } from "@/lib/acompanhamento-obras/types";

type PortalAcompanhamentoHistoricoProps = {
  refreshKey: number;
};

export default function PortalAcompanhamentoHistorico({
  refreshKey,
}: PortalAcompanhamentoHistoricoProps) {
  const [itens, setItens] = useState<AcompanhamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        setCarregando(true);
        const data = await listarAcompanhamentosPortalAction();
        if (!cancelado) setItens(data);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [refreshKey]);

  return (
    <article className={portalCardClassName}>
      <header className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(138_46_31/0.08)] text-[var(--cedro-brown)]">
          <Camera className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--cedro-text)]">
            Meu histórico
          </h2>
          <p className="text-sm text-[var(--cedro-text-muted)]">
            Atualizações que você enviou.
          </p>
        </div>
      </header>

      {carregando && itens.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-[var(--cedro-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando histórico…
        </p>
      ) : itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--cedro-border)] px-4 py-8 text-center text-sm text-[var(--cedro-text-muted)]">
          Nenhuma atualização enviada ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {itens.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--cedro-border)] bg-[#fafafa] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--cedro-text)]">
                    {item.obra_nome}
                  </p>
                  <p className="text-xs text-[var(--cedro-text-muted)]">
                    {formatDataAtualizacao(item.data_atualizacao)} · {item.etapa}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--cedro-text-muted)] ring-1 ring-[var(--cedro-border)]">
                  {item.total_fotos} foto{item.total_fotos === 1 ? "" : "s"}
                </span>
              </div>
              {item.observacao_funcionario?.trim() ? (
                <p className="mt-2 text-sm text-[var(--cedro-text)]">
                  {resumirObservacao(item.observacao_funcionario, 200)}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-[var(--cedro-text-muted)]">
                  Sem observação
                </p>
              )}
              <p className="mt-2 text-xs text-[var(--cedro-text-muted)]">
                Enviado em {formatDataHoraEnvio(item.criado_em)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
