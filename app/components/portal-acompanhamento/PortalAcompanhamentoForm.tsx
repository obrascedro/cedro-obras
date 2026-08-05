"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useActionState, useCallback, useId, useState } from "react";
import {
  portalAcompanhamentoEnviarAction,
  type PortalAcompanhamentoState,
} from "@/app/actions/portal-acompanhamento";
import PortalAcompanhamentoFotosZone, {
  type FotoPreview,
} from "@/app/components/portal-acompanhamento/PortalAcompanhamentoFotosZone";
import { PortalErrorBanner } from "@/app/components/portal-notas/PortalWarningBanner";
import { portalCardClassName, selectClassName } from "@/app/components/ui/form-styles";
import {
  ACOMPANHAMENTO_MAX_FOTOS,
  ACOMPANHAMENTO_MAX_SIZE_BYTES,
  ACOMPANHAMENTO_MSG,
} from "@/lib/acompanhamento-obras/config";
import { ETAPA_OUTRO, ETAPAS_OBRA } from "@/lib/acompanhamento-obras/etapas";
import { formatDataHoraEnvio } from "@/lib/acompanhamento-obras/format";
import { isFotoAcompanhamentoAceita } from "@/lib/acompanhamento-obras/validar-fotos";
import { formatFileSize, type ObraOption } from "@/lib/notas-fiscais";

type PortalAcompanhamentoFormProps = {
  obras: ObraOption[];
  onEnviado: () => void;
};

const initialState: PortalAcompanhamentoState = {};
const fieldLabelClass = "text-sm font-semibold text-[var(--cedro-text)]";

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PortalAcompanhamentoForm({
  obras,
  onEnviado,
}: PortalAcompanhamentoFormProps) {
  const formId = useId();
  const [state, formAction, pending] = useActionState(
    portalAcompanhamentoEnviarAction,
    initialState
  );
  const [obraId, setObraId] = useState("");
  const [etapa, setEtapa] = useState("");
  const [etapaOutro, setEtapaOutro] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataAtualizacao, setDataAtualizacao] = useState(hojeIso());
  const [fotos, setFotos] = useState<FotoPreview[]>([]);
  const [erroLocal, setErroLocal] = useState("");

  const limparFotos = useCallback(() => {
    setFotos((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return [];
    });
  }, []);

  function adicionarFotos(files: File[]) {
    setErroLocal("");
    const novas: FotoPreview[] = [];

    for (const file of files) {
      if (fotos.length + novas.length >= ACOMPANHAMENTO_MAX_FOTOS) {
        setErroLocal(ACOMPANHAMENTO_MSG.maxFotos);
        break;
      }
      if (file.size > ACOMPANHAMENTO_MAX_SIZE_BYTES) {
        setErroLocal(ACOMPANHAMENTO_MSG.arquivoGrande);
        continue;
      }
      if (!isFotoAcompanhamentoAceita(file)) {
        setErroLocal(ACOMPANHAMENTO_MSG.tipoInvalido);
        continue;
      }
      novas.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (novas.length > 0) {
      setFotos((prev) => [...prev, ...novas]);
    }
  }

  function removerFoto(id: string) {
    setFotos((prev) => {
      const alvo = prev.find((f) => f.id === id);
      if (alvo) URL.revokeObjectURL(alvo.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!obraId) {
      setErroLocal("Selecione a obra.");
      return;
    }
    if (!etapa) {
      setErroLocal("Selecione a etapa.");
      return;
    }
    if (etapa === ETAPA_OUTRO && !etapaOutro.trim()) {
      setErroLocal("Informe a etapa manualmente.");
      return;
    }
    if (fotos.length === 0) {
      setErroLocal(ACOMPANHAMENTO_MSG.semFotos);
      return;
    }
    setErroLocal("");

    const fd = new FormData(e.currentTarget);
    fd.delete("fotos");
    for (const foto of fotos) {
      fd.append("fotos", foto.file);
    }
    formAction(fd);
  }

  if (state.sucesso) {
    return (
      <article className={portalCardClassName}>
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2
            className="h-12 w-12 text-[var(--cedro-success)]"
            strokeWidth={1.5}
          />
          <h2 className="mt-4 text-lg font-bold text-[var(--cedro-text)]">
            Atualização enviada
          </h2>
          <p className="mt-2 text-sm text-[var(--cedro-text-muted)]">
            {state.sucesso.obraNome} · {state.sucesso.totalFotos} foto
            {state.sucesso.totalFotos === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-[var(--cedro-text-muted)]">
            {formatDataHoraEnvio(state.sucesso.enviadoEm)}
          </p>
          <button
            type="button"
            onClick={() => {
              limparFotos();
              setObraId("");
              setEtapa("");
              setEtapaOutro("");
              setObservacao("");
              setDataAtualizacao(hojeIso());
              onEnviado();
            }}
            className="mt-6 rounded-[10px] bg-[var(--cedro-brown)] px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
          >
            Enviar nova atualização
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className={portalCardClassName}>
      <header className="mb-5">
        <h2 className="text-base font-bold text-[var(--cedro-text)] sm:text-[1.0625rem]">
          Enviar atualização
        </h2>
        <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
          Registre fotos e observações do andamento da obra.
        </p>
      </header>

      {state.erro ? <PortalErrorBanner title={state.erro} /> : null}
      {erroLocal ? <PortalErrorBanner title={erroLocal} /> : null}

      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor={`${formId}-obra`} className={fieldLabelClass}>
            Obra *
          </label>
          <select
            id={`${formId}-obra`}
            name="obraId"
            required
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            disabled={pending || obras.length === 0}
            className={`mt-1.5 w-full ${selectClassName}`}
          >
            <option value="">Selecionar obra</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-data`} className={fieldLabelClass}>
            Data da atualização *
          </label>
          <input
            id={`${formId}-data`}
            name="dataAtualizacao"
            type="date"
            required
            value={dataAtualizacao}
            onChange={(e) => setDataAtualizacao(e.target.value)}
            disabled={pending}
            className="mt-1.5 w-full rounded-[10px] border border-[var(--cedro-border)] px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-etapa`} className={fieldLabelClass}>
            Etapa da obra *
          </label>
          <select
            id={`${formId}-etapa`}
            name="etapa"
            required
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            disabled={pending}
            className={`mt-1.5 w-full ${selectClassName}`}
          >
            <option value="">Selecionar etapa</option>
            {ETAPAS_OBRA.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {etapa === ETAPA_OUTRO ? (
          <div>
            <label htmlFor={`${formId}-etapa-outro`} className={fieldLabelClass}>
              Descreva a etapa *
            </label>
            <input
              id={`${formId}-etapa-outro`}
              name="etapaOutro"
              type="text"
              value={etapaOutro}
              onChange={(e) => setEtapaOutro(e.target.value)}
              disabled={pending}
              maxLength={120}
              className="mt-1.5 w-full rounded-[10px] border border-[var(--cedro-border)] px-3 py-2.5 text-sm"
              placeholder="Ex.: Impermeabilização"
            />
          </div>
        ) : (
          <input type="hidden" name="etapaOutro" value="" />
        )}

        <div>
          <label htmlFor={`${formId}-obs`} className={fieldLabelClass}>
            Observação do funcionário (opcional)
          </label>
          <textarea
            id={`${formId}-obs`}
            name="observacao"
            rows={4}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            disabled={pending}
            maxLength={2000}
            placeholder="Ex.: revestimento concluído no banheiro do bloco B."
            className="mt-1.5 w-full rounded-[10px] border border-[var(--cedro-border)] px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <p className={fieldLabelClass}>Fotos *</p>
          <div className="mt-1.5">
            <PortalAcompanhamentoFotosZone
              fotos={fotos}
              onAddFiles={adicionarFotos}
              onRemove={removerFoto}
              disabled={pending}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--cedro-text-muted)]">
            Máximo {ACOMPANHAMENTO_MAX_FOTOS} fotos · {formatFileSize(ACOMPANHAMENTO_MAX_SIZE_BYTES)} cada
          </p>
        </div>

        <button
          type="submit"
          disabled={pending || obras.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--cedro-brown)] py-3.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Enviar atualização
            </>
          )}
        </button>
      </form>
    </article>
  );
}
