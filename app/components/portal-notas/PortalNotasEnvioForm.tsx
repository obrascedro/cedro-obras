"use client";

import Link from "next/link";
import { CheckCircle2, FileText, Loader2, Send } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import {
  portalNotasEnviarAction,
  type PortalNotasEnvioResultado,
  type PortalNotasEnvioState,
} from "@/app/actions/portal-notas";
import { PortalErrorBanner } from "@/app/components/portal-notas/PortalWarningBanner";
import PortalUploadZone, {
  PortalNotaFileInputs,
  PortalUploadPreview,
} from "@/app/components/portal-notas/PortalUploadZone";
import { portalCardClassName, selectClassName } from "@/app/components/ui/form-styles";
import {
  isHeicFile,
  MSG_FORMATO_HEIC,
  MSG_FORMATO_NAO_SUPORTADO,
} from "@/lib/portal-notas/formatos-arquivo";
import {
  formatFileSize,
  isAcceptedFile,
  isImageType,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
  type ObraOption,
} from "@/lib/notas-fiscais";

type PortalNotasEnvioFormProps = {
  obras: ObraOption[];
  onNovaNota: () => void;
};

const initialState: PortalNotasEnvioState = {};

const fieldLabelClass =
  "text-sm font-semibold text-[var(--cedro-text)]";

export default function PortalNotasEnvioForm({
  obras,
  onNovaNota,
}: PortalNotasEnvioFormProps) {
  const [state, formAction, pending] = useActionState(
    portalNotasEnviarAction,
    initialState
  );
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [obraId, setObraId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState("");
  const [dragging, setDragging] = useState(false);
  const pickerId = useId();
  const cameraInputId = `${pickerId}-camera`;
  const galleryInputId = `${pickerId}-gallery`;

  const enviando = pending || isSubmitting;

  function limparArquivo() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArquivo(null);
    setPreviewUrl(null);
    setErroLocal("");
  }

  function selecionarArquivo(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setArquivo(null);
    setErroLocal("");

    if (!file) return;

    if (isHeicFile(file)) {
      setErroLocal(MSG_FORMATO_HEIC);
      return;
    }

    if (!isAcceptedFile(file)) {
      setErroLocal(MSG_FORMATO_NAO_SUPORTADO);
      return;
    }

    if (file.size > NOTAS_FISCAIS_MAX_SIZE_BYTES) {
      setErroLocal(`Arquivo excede ${formatFileSize(NOTAS_FISCAIS_MAX_SIZE_BYTES)}.`);
      return;
    }

    if (file.size === 0) {
      setErroLocal("Arquivo vazio. Selecione outra foto.");
      return;
    }

    setArquivo(file);
    if (isImageType(file.type) && !isHeicFile(file)) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (enviando) return;

    if (!obraId) {
      setErroLocal("Selecione a obra.");
      return;
    }
    if (!arquivo || arquivo.size === 0) {
      setErroLocal("Tire uma foto ou escolha um arquivo.");
      return;
    }
    if (isHeicFile(arquivo)) {
      setErroLocal(MSG_FORMATO_HEIC);
      return;
    }

    setErroLocal("");

    const fd = new FormData();
    fd.set("obraId", obraId);
    fd.set("observacoes", observacoes);
    fd.set("arquivo", arquivo, arquivo.name);

    startSubmitTransition(() => {
      formAction(fd);
    });
  }

  if (state.sucesso) {
    return (
      <PortalNotasConfirmacao
        resultado={state.sucesso}
        onNovaNota={() => {
          limparArquivo();
          onNovaNota();
        }}
      />
    );
  }

  return (
    <article className={portalCardClassName}>
      <header className="mb-6 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(138_46_31/0.08)] text-[var(--cedro-brown)]">
          <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--cedro-text)] sm:text-[1.0625rem]">
            Enviar nota fiscal
          </h2>
          <p className="mt-0.5 text-sm text-[var(--cedro-text-muted)]">
            Fotografe ou anexe a nota para envio automático.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-5"
      >
        <div>
          <label htmlFor="obraId" className={fieldLabelClass}>
            Obra <span className="text-[var(--cedro-brown)]">*</span>
          </label>
          <select
            id="obraId"
            name="obraId"
            required
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            disabled={enviando}
            className={`mt-2 ${selectClassName}`}
          >
            <option value="">Selecione a obra</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className={fieldLabelClass}>
            Foto ou arquivo da nota{" "}
            <span className="text-[var(--cedro-brown)]">*</span>
          </p>

          <div className="mt-2">
            {!arquivo ? (
              <PortalUploadZone
                cameraInputId={cameraInputId}
                galleryInputId={galleryInputId}
                disabled={obras.length === 0 || enviando}
                dragging={dragging}
                onDragStateChange={setDragging}
                onDropFile={selecionarArquivo}
              />
            ) : (
              <PortalUploadPreview
                arquivo={arquivo}
                previewUrl={previewUrl}
                galleryInputId={galleryInputId}
                onRemover={limparArquivo}
              />
            )}
          </div>

          <PortalNotaFileInputs
            cameraInputId={cameraInputId}
            galleryInputId={galleryInputId}
            disabled={obras.length === 0 || enviando}
            onFileSelected={selecionarArquivo}
          />

          {arquivo ? (
            <p
              className="mt-2 text-xs text-[var(--cedro-text-muted)]"
              aria-live="polite"
            >
              1 arquivo selecionado: {arquivo.name} (
              {formatFileSize(arquivo.size)})
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="observacoes" className={fieldLabelClass}>
            Observação{" "}
            <span className="font-normal text-[var(--cedro-text-muted)]">
              (opcional)
            </span>
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            disabled={enviando}
            placeholder="Ex.: material para alvenaria do bloco B"
            className={`mt-2 min-h-[5.5rem] w-full resize-y rounded-xl border border-[var(--cedro-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--cedro-text)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--cedro-text-muted)] focus:border-[var(--cedro-brown)] focus:ring-2 focus:ring-[rgb(138_46_31/0.12)]`}
          />
        </div>

        {(erroLocal || state.erro) && (
          <PortalErrorBanner
            title={erroLocal || state.erro || "Erro ao enviar"}
          />
        )}

        <button
          type="submit"
          disabled={enviando || obras.length === 0}
          className="cedro-btn-primary flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3.5 text-base font-semibold disabled:opacity-55"
        >
          {enviando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Enviando nota…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Enviar nota
            </>
          )}
        </button>
      </form>
    </article>
  );
}

type PortalNotasConfirmacaoProps = {
  resultado: PortalNotasEnvioResultado;
  onNovaNota: () => void;
};

function PortalNotasConfirmacao({
  resultado,
  onNovaNota,
}: PortalNotasConfirmacaoProps) {
  const horario = new Date(resultado.enviadoEm).toLocaleString("pt-BR");

  return (
    <article className={`${portalCardClassName} text-center`}>
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cedro-success-bg)] text-[var(--cedro-success)]">
        <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-[var(--cedro-text)]">
        Nota enviada com sucesso
      </h2>
      <p className="mt-2 text-sm text-[var(--cedro-text-muted)]">
        Ela foi encaminhada para análise e aprovação.
      </p>

      <dl className="mt-6 space-y-2.5 rounded-xl bg-[#fafafa] p-4 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--cedro-text-muted)]">Obra</dt>
          <dd className="font-medium text-[var(--cedro-text)]">
            {resultado.obraNome}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--cedro-text-muted)]">Horário</dt>
          <dd className="font-medium text-[var(--cedro-text)]">{horario}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--cedro-text-muted)]">Referência</dt>
          <dd className="font-mono font-medium text-[var(--cedro-text)]">
            #{resultado.notaReferencia}
          </dd>
        </div>
      </dl>

      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={onNovaNota}
          className="cedro-btn-primary w-full rounded-[10px] px-4 py-3.5 text-base font-semibold"
        >
          Enviar outra nota
        </button>
        <Link
          href="/portal/minhas-notas"
          className="cedro-btn-secondary block w-full rounded-[10px] px-4 py-3.5 text-base font-semibold"
        >
          Ver minhas notas
        </Link>
      </div>
    </article>
  );
}
