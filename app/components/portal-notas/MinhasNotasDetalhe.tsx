"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { obterUrlArquivoNotaPortalAction } from "@/app/actions/portal-minhas-notas";
import { PortalErrorBanner } from "@/app/components/portal-notas/PortalWarningBanner";
import StatusBadge from "@/app/components/ui/StatusBadge";
import {
  portalCardClassName,
} from "@/app/components/ui/form-styles";
import {
  formatDataHoraEnvio,
  formatReferenciaNota,
  formatStatusFuncionario,
} from "@/lib/portal-notas/status-funcionario";
import type { NotaFuncionarioDetalhe } from "@/lib/portal-notas/minhas-notas";
import { formatCurrency, formatDate } from "@/lib/format";
import { normalizarStatusNota } from "@/lib/notas-fiscais-status";

type MinhasNotasDetalheProps = {
  nota: NotaFuncionarioDetalhe;
};

function statusBadgeVariant(
  status: string
): "success" | "warning" | "error" | "neutral" | "teal" {
  switch (normalizarStatusNota(status)) {
    case "aguardando":
      return "neutral";
    case "processando":
      return "teal";
    case "pendente_aprovacao":
    case "correcao_solicitada":
      return "warning";
    case "aprovada":
      return "success";
    case "rejeitada":
    case "erro":
      return "error";
    default:
      return "teal";
  }
}

export default function MinhasNotasDetalhe({ nota }: MinhasNotasDetalheProps) {
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await obterUrlArquivoNotaPortalAction(nota.id);
      if ("url" in result) {
        setArquivoUrl(result.url);
      } else {
        setErroArquivo(result.erro);
      }
    });
  }, [nota.id]);

  const isPdf = (nota.arquivo_tipo ?? "").includes("pdf");
  const isImagem = (nota.arquivo_tipo ?? "").startsWith("image/");

  return (
    <article className={portalCardClassName}>
        <Link
          href="/portal/minhas-notas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cedro-brown)] transition-colors duration-200 hover:text-[var(--cedro-brown-hover)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar para minhas notas
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-[var(--cedro-text)]">
            Nota #{formatReferenciaNota(nota.id)}
          </h2>
          <StatusBadge variant={statusBadgeVariant(nota.status_processamento)}>
            {formatStatusFuncionario(nota.status_processamento)}
          </StatusBadge>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--cedro-border)] bg-[var(--cedro-bg)]">
          {pending ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--cedro-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Carregando arquivo…
            </div>
          ) : erroArquivo ? (
            <div className="m-4">
              <PortalErrorBanner title={erroArquivo} />
            </div>
          ) : arquivoUrl && isImagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={arquivoUrl}
              alt={`Nota ${nota.arquivo_nome}`}
              className="max-h-96 w-full bg-[var(--cedro-bg)] object-contain"
            />
          ) : arquivoUrl && isPdf ? (
            <iframe
              src={arquivoUrl}
              title={nota.arquivo_nome}
              className="h-96 w-full bg-[var(--cedro-bg)]"
            />
          ) : arquivoUrl ? (
            <div className="p-6 text-center">
              <a
                href={arquivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--cedro-brown)] hover:underline"
              >
                Abrir {nota.arquivo_nome}
              </a>
            </div>
          ) : null}
        </section>

        {nota.status_processamento === "erro" ? (
          <div className="mt-4">
            <PortalErrorBanner title="Não foi possível processar esta nota. Procure o administrador." />
          </div>
        ) : null}

        <dl className="mt-5 space-y-3 border-t border-[var(--cedro-border)] pt-5 text-sm">
          <Item label="Obra" value={nota.obra_nome} />
          <Item label="Enviada em" value={formatDataHoraEnvio(nota.criado_em)} />
          <Item label="Fornecedor" value={nota.fornecedor ?? "—"} />
          <Item label="Data da nota" value={formatDate(nota.data_nota)} />
          <Item
            label="Valor total"
            value={
              nota.valor_total != null
                ? formatCurrency(nota.valor_total)
                : "—"
            }
          />
          <Item label="Arquivo" value={nota.arquivo_nome} />
          {nota.observacoes ? (
            <Item label="Sua observação" value={nota.observacoes} />
          ) : null}
          {nota.motivo_rejeicao ? (
            <Item label="Motivo da rejeição" value={nota.motivo_rejeicao} />
          ) : null}
        </dl>

      {nota.itens_json && nota.itens_json.length > 0 ? (
        <div className="mt-5 border-t border-[var(--cedro-border)] pt-5">
          <h3 className="text-sm font-semibold text-[var(--cedro-text)]">
            Produtos identificados
          </h3>
          <ul className="mt-3 space-y-2">
            {nota.itens_json.map((item, index) => (
              <li
                key={`${item.descricao}-${index}`}
                className="rounded-xl bg-[#fafafa] px-4 py-3 text-sm"
              >
                <p className="font-medium text-[var(--cedro-text)]">
                  {item.descricao}
                </p>
                <p className="mt-0.5 text-xs text-[var(--cedro-text-muted)]">
                  {item.quantidade != null ? `${item.quantidade} un. · ` : ""}
                  {item.categoria ?? "—"} · {item.etapa ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--cedro-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-[var(--cedro-text)]">{value}</dd>
    </div>
  );
}
