"use client";

import { Camera, CloudUpload, X } from "lucide-react";
import { useId } from "react";
import {
  ACOMPANHAMENTO_MAX_FOTOS,
  ACOMPANHAMENTO_MAX_SIZE_BYTES,
} from "@/lib/acompanhamento-obras/config";
import { formatFileSize } from "@/lib/notas-fiscais";
import {
  portalFileInputHiddenClass,
  portalPickerCameraClass,
  portalPickerGalleryClass,
} from "@/app/components/portal/portal-file-input-styles";

export type FotoPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

type PortalAcompanhamentoFotosZoneProps = {
  fotos: FotoPreview[];
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  erro?: string;
};

export default function PortalAcompanhamentoFotosZone({
  fotos,
  onAddFiles,
  onRemove,
  disabled = false,
  erro,
}: PortalAcompanhamentoFotosZoneProps) {
  const uid = useId();
  const cameraInputId = `${uid}-acompanhamento-camera`;
  const galleryInputId = `${uid}-acompanhamento-gallery`;
  const maxSizeLabel = formatFileSize(ACOMPANHAMENTO_MAX_SIZE_BYTES);
  const restantes = ACOMPANHAMENTO_MAX_FOTOS - fotos.length;
  const pickersDisabled = disabled || restantes <= 0;

  function handleFiles(list: FileList | null) {
    if (!list || pickersDisabled) return;
    const novos = Array.from(list).slice(0, restantes);
    if (novos.length > 0) onAddFiles(novos);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    event.currentTarget.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed border-[var(--cedro-border)] bg-[#fafafa] opacity-60"
            : "border-[#e0e0e0] bg-[#fafafa] hover:border-[rgb(138_46_31/0.35)]"
        }`}
      >
        <CloudUpload
          className="mx-auto h-8 w-8 text-[var(--cedro-brown)]"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="mt-2 text-sm font-semibold text-[var(--cedro-brown)]">
          Adicionar fotos da obra
        </p>
        <p className="mt-1 text-xs text-[var(--cedro-text-muted)]">
          JPG, PNG ou WEBP · máx. {maxSizeLabel} · até {ACOMPANHAMENTO_MAX_FOTOS}{" "}
          fotos
        </p>
        <p
          className="mt-1 text-xs text-[var(--cedro-text-muted)]"
          aria-live="polite"
        >
          {fotos.length}/{ACOMPANHAMENTO_MAX_FOTOS} selecionada
          {fotos.length === 1 ? "" : "s"}
          {restantes > 0
            ? ` · você pode adicionar mais ${restantes}`
            : " · limite atingido"}
        </p>

        <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2 sm:flex-row">
          <label
            htmlFor={cameraInputId}
            role="button"
            aria-label="Tirar foto com a câmera"
            aria-disabled={pickersDisabled}
            className={`${portalPickerCameraClass}${pickersDisabled ? " pointer-events-none opacity-50" : ""}`}
          >
            <Camera className="pointer-events-none h-4 w-4 shrink-0" aria-hidden />
            Tirar foto
          </label>
          <label
            htmlFor={galleryInputId}
            role="button"
            aria-label="Escolher fotos da galeria"
            aria-disabled={pickersDisabled}
            className={`${portalPickerGalleryClass}${pickersDisabled ? " pointer-events-none opacity-50" : ""}`}
          >
            Escolher foto
          </label>
        </div>

        <input
          id={cameraInputId}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={pickersDisabled}
          className={portalFileInputHiddenClass}
          aria-label="Tirar foto com a câmera"
          onChange={handleInputChange}
        />
        <input
          id={galleryInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={pickersDisabled}
          className={portalFileInputHiddenClass}
          aria-label="Escolher fotos da galeria"
          onChange={handleInputChange}
        />
      </div>

      {erro ? (
        <p className="text-sm text-[var(--cedro-error)]" role="alert">
          {erro}
        </p>
      ) : null}

      {fotos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto) => (
            <li key={foto.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.previewUrl}
                alt={foto.file.name}
                className="aspect-square w-full rounded-xl border border-[var(--cedro-border)] object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(foto.id)}
                disabled={disabled}
                className="absolute right-2 top-2 flex h-7 w-7 touch-manipulation items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label={`Remover ${foto.file.name}`}
              >
                <X className="pointer-events-none h-4 w-4" aria-hidden />
              </button>
              <p className="mt-1 truncate text-xs text-[var(--cedro-text-muted)]">
                {foto.file.name}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
