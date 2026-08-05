"use client";

import { Camera, CloudUpload } from "lucide-react";
import { useId } from "react";
import {
  formatFileSize,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
} from "@/lib/notas-fiscais";
import {
  portalFileInputHiddenClass,
  portalPickerCameraClass,
  portalPickerGalleryClass,
} from "@/app/components/portal/portal-file-input-styles";

type PortalUploadZoneProps = {
  cameraInputId?: string;
  galleryInputId?: string;
  disabled?: boolean;
  dragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onDropFile: (file: File) => void;
};

export default function PortalUploadZone({
  cameraInputId: cameraInputIdProp,
  galleryInputId: galleryInputIdProp,
  disabled = false,
  dragging,
  onDragStateChange,
  onDropFile,
}: PortalUploadZoneProps) {
  const autoId = useId();
  const cameraInputId = cameraInputIdProp ?? `${autoId}-camera`;
  const galleryInputId = galleryInputIdProp ?? `${autoId}-gallery`;
  const maxSizeLabel = formatFileSize(NOTAS_FISCAIS_MAX_SIZE_BYTES);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) onDragStateChange(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragStateChange(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragStateChange(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onDropFile(file);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-150 sm:px-6 sm:py-9 ${
        disabled
          ? "cursor-not-allowed border-[var(--cedro-border)] bg-[#fafafa] opacity-60"
          : dragging
            ? "border-[var(--cedro-brown)] bg-[rgb(138_46_31/0.02)]"
            : "border-[#e0e0e0] bg-[#fafafa] hover:border-[rgb(138_46_31/0.35)]"
      }`}
    >
      <CloudUpload
        className="mx-auto h-9 w-9 text-[var(--cedro-brown)]"
        strokeWidth={1.5}
        aria-hidden
      />

      <label
        htmlFor={galleryInputId}
        className={`mt-3 block text-[0.9375rem] font-semibold text-[var(--cedro-brown)] ${
          disabled ? "cursor-not-allowed" : "cursor-pointer touch-manipulation"
        }`}
      >
        Clique para enviar ou arraste sua nota fiscal
      </label>
      <p className="mt-1 text-xs text-[var(--cedro-text-muted)]">
        ou escolha um arquivo abaixo
      </p>
      <p className="mt-2 text-xs text-[var(--cedro-text-muted)]">
        Suporte: JPG, PNG, WEBP, PDF (máx. {maxSizeLabel})
      </p>

      <div className="mx-auto mt-5 flex max-w-sm flex-col gap-2 sm:flex-row sm:gap-2.5">
        <label
          htmlFor={cameraInputId}
          role="button"
          aria-label="Tirar foto da nota fiscal"
          aria-disabled={disabled}
          className={`${portalPickerCameraClass}${disabled ? " pointer-events-none opacity-50" : ""}`}
        >
          <Camera className="pointer-events-none h-4 w-4 shrink-0" aria-hidden />
          Tirar foto
        </label>
        <label
          htmlFor={galleryInputId}
          role="button"
          aria-label="Escolher arquivo da galeria"
          aria-disabled={disabled}
          className={`${portalPickerGalleryClass}${disabled ? " pointer-events-none opacity-50" : ""}`}
        >
          Escolher arquivo
        </label>
      </div>
    </div>
  );
}

type PortalNotaFileInputsProps = {
  cameraInputId: string;
  galleryInputId: string;
  disabled?: boolean;
  onFileSelected: (file: File | null) => void;
};

/** Inputs reais associados aos labels — devem permanecer montados no formulário. */
export function PortalNotaFileInputs({
  cameraInputId,
  galleryInputId,
  disabled = false,
  onFileSelected,
}: PortalNotaFileInputsProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelected(file);
    event.currentTarget.value = "";
  }

  return (
    <>
      <input
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        className={portalFileInputHiddenClass}
        aria-label="Tirar foto da nota fiscal"
        onChange={handleChange}
      />
      <input
        id={galleryInputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
        disabled={disabled}
        className={portalFileInputHiddenClass}
        aria-label="Escolher arquivo da galeria ou documentos"
        onChange={handleChange}
      />
    </>
  );
}

type PortalUploadPreviewProps = {
  arquivo: File;
  previewUrl: string | null;
  galleryInputId: string;
  onRemover: () => void;
};

export function PortalUploadPreview({
  arquivo,
  previewUrl,
  galleryInputId,
  onRemover,
}: PortalUploadPreviewProps) {
  return (
    <div className="space-y-3">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Prévia da nota"
          className="max-h-64 w-full rounded-xl border border-[var(--cedro-border)] bg-[#fafafa] object-contain"
        />
      ) : arquivo.type.startsWith("image/") ? (
        <div className="rounded-xl border border-[var(--cedro-border)] bg-[#fafafa] p-6 text-center text-sm text-[var(--cedro-text-muted)]">
          Prévia indisponível para este formato. O envio continuará normalmente se
          o arquivo for JPG, PNG ou WEBP.
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[var(--cedro-border)] bg-[#fafafa] p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--cedro-brown)] text-sm font-bold text-white">
            PDF
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-[var(--cedro-text)]">
              {arquivo.name}
            </p>
            <p className="text-xs text-[var(--cedro-text-muted)]">
              {formatFileSize(arquivo.size)}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--cedro-text-muted)]">
        1 arquivo selecionado
      </p>

      <div className="flex gap-2">
        <label
          htmlFor={galleryInputId}
          role="button"
          className={`${portalPickerGalleryClass} flex-1 py-2.5`}
        >
          Trocar arquivo
        </label>
        <button
          type="button"
          onClick={onRemover}
          className="flex-1 rounded-[10px] border border-[var(--cedro-error)]/20 bg-[var(--cedro-error-bg)] py-2.5 text-sm font-semibold text-[var(--cedro-error)] touch-manipulation"
        >
          Remover
        </button>
      </div>
    </div>
  );
}
