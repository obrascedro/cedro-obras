"use client";

import { useActionState, useRef, useState } from "react";
import {
  portalNotasEnviarAction,
  portalNotasLogoutAction,
  type PortalNotasEnvioResultado,
  type PortalNotasEnvioState,
} from "@/app/actions/portal-notas";
import {
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import {
  formatFileSize,
  isAcceptedFile,
  isImageType,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
  type ObraOption,
} from "@/lib/notas-fiscais";

type PortalNotasEnvioFormProps = {
  nomeFuncionario: string;
  obras: ObraOption[];
  onNovaNota: () => void;
};

const initialState: PortalNotasEnvioState = {};

export default function PortalNotasEnvioForm({
  nomeFuncionario,
  obras,
  onNovaNota,
}: PortalNotasEnvioFormProps) {
  const [state, formAction, pending] = useActionState(
    portalNotasEnviarAction,
    initialState
  );
  const [obraId, setObraId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState("");
  const inputCameraRef = useRef<HTMLInputElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const inputSubmitRef = useRef<HTMLInputElement>(null);

  function limparArquivo() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArquivo(null);
    setPreviewUrl(null);
    setErroLocal("");
    if (inputCameraRef.current) inputCameraRef.current.value = "";
    if (inputFileRef.current) inputFileRef.current.value = "";
    if (inputSubmitRef.current) inputSubmitRef.current.value = "";
  }

  function aplicarArquivoNoInput(file: File) {
    if (!inputSubmitRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    inputSubmitRef.current.files = dt.files;
  }

  function selecionarArquivo(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setArquivo(null);
    setErroLocal("");

    if (!file) return;

    if (!isAcceptedFile(file)) {
      setErroLocal("Use JPG, PNG, WEBP ou PDF.");
      return;
    }

    if (file.size > NOTAS_FISCAIS_MAX_SIZE_BYTES) {
      setErroLocal("Arquivo excede 10 MB.");
      return;
    }

    setArquivo(file);
    aplicarArquivoNoInput(file);
    if (isImageType(file.type)) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!obraId) {
      e.preventDefault();
      setErroLocal("Selecione a obra.");
      return;
    }
    if (!arquivo) {
      e.preventDefault();
      setErroLocal("Tire uma foto ou escolha um arquivo.");
      return;
    }
    setErroLocal("");
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
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6 pb-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-emerald-600 uppercase">
            Cedro Obras
          </p>
          <h1 className="mt-1 text-xl font-bold">Enviar nota fiscal</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Olá,{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {nomeFuncionario}
            </span>
          </p>
        </div>
        <form action={portalNotasLogoutAction}>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sair
          </button>
        </form>
      </header>

      <form
        action={formAction}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-5"
      >
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <label htmlFor="obraId" className={labelClassName}>
            Obra <span className="text-red-500">*</span>
          </label>
          <select
            id="obraId"
            name="obraId"
            required
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            className={`mt-1.5 ${selectClassName}`}
          >
            <option value="">Selecione a obra</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className={labelClassName}>
            Foto ou arquivo da nota <span className="text-red-500">*</span>
          </p>

          {!arquivo ? (
            <div className="mt-3 grid gap-3">
              <button
                type="button"
                onClick={() => inputCameraRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white hover:bg-emerald-700"
              >
                Tirar foto da nota
              </button>
              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Escolher arquivo
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {previewUrl ? (
                // Prévia local (blob:) — next/image não se aplica
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Prévia da nota"
                  className="max-h-64 w-full rounded-xl border border-zinc-200 object-contain dark:border-zinc-700"
                />
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
                  <span className="text-2xl font-bold text-zinc-400">PDF</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{arquivo.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(arquivo.size)}
                    </p>
                  </div>
                </div>
              )}
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                  {arquivo.name}
                </p>
                <p>{formatFileSize(arquivo.size)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => inputFileRef.current?.click()}
                  className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Trocar arquivo
                </button>
                <button
                  type="button"
                  onClick={limparArquivo}
                  className="flex-1 rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          <input
            ref={inputCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)}
          />
          <input
            ref={inputFileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
            className="sr-only"
            onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)}
          />
          <input
            ref={inputSubmitRef}
            type="file"
            name="arquivo"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <label htmlFor="observacoes" className={labelClassName}>
            Observação{" "}
            <span className="font-normal text-zinc-500">(opcional)</span>
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: material para alvenaria do bloco B"
            className={`mt-1.5 resize-none ${inputClassName}`}
          />
        </div>

        {(erroLocal || state.erro) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {erroLocal || state.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || obras.length === 0}
          className="w-full rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Enviando e analisando…" : "Enviar nota"}
        </button>

        {obras.length === 0 ? (
          <p className="text-center text-sm text-amber-700 dark:text-amber-400">
            Nenhuma obra cadastrada. Contacte o administrador.
          </p>
        ) : null}
      </form>
    </main>
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          ✓
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Nota enviada com sucesso
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Ela foi encaminhada para análise e aprovação.
        </p>
        <dl className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-4 text-left text-sm dark:bg-zinc-950/50">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Obra</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {resultado.obraNome}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Horário</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {horario}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Referência</dt>
            <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-50">
              #{resultado.notaReferencia}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onNovaNota}
          className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white hover:bg-emerald-700"
        >
          Enviar outra nota
        </button>
      </div>
    </main>
  );
}
