"use client";

import { Camera, CloudUpload } from "lucide-react";
import {
  formatFileSize,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
} from "@/lib/notas-fiscais";
import Button from "@/app/components/ui/Button";

type UploadProps = {
  onSelectFile: () => void;
  onCameraClick: () => void;
  disabled?: boolean;
  dragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onDropFile: (file: File) => void;
};

export default function Upload({
  onSelectFile,
  onCameraClick,
  disabled = false,
  dragging,
  onDragStateChange,
  onDropFile,
}: UploadProps) {
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
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        if (!disabled) onSelectFile();
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectFile();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-disabled={disabled}
      className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cedro-brown)] focus-visible:ring-offset-2 sm:px-8 sm:py-12 ${
        disabled
          ? "cursor-not-allowed border-[var(--cedro-border)] bg-[var(--cedro-bg)] opacity-60"
          : dragging
            ? "cursor-pointer border-[var(--cedro-brown)] bg-[rgb(138_46_31/0.03)]"
            : "cursor-pointer border-[var(--cedro-border)] bg-[var(--cedro-bg)] hover:border-[rgb(138_46_31/0.3)] hover:bg-white"
      }`}
    >
      <CloudUpload
        className="h-10 w-10 text-[var(--cedro-brown)] sm:h-11 sm:w-11"
        strokeWidth={1.5}
        aria-hidden
      />

      <p className="mt-4 text-base font-semibold text-[var(--cedro-brown)] sm:text-[1.0625rem]">
        Clique ou arraste sua nota aqui
      </p>
      <p className="mt-1.5 text-sm text-[var(--cedro-text-muted)]">
        ou escolha um arquivo
      </p>
      <p className="mt-3 text-xs text-[var(--cedro-text-muted)]">
        JPG, PNG, WEBP ou PDF · Máx. {maxSizeLabel}
      </p>

      <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={disabled}
          fullWidth
          onClick={(event) => {
            event.stopPropagation();
            onCameraClick();
          }}
        >
          <Camera className="h-4 w-4" aria-hidden />
          Tirar foto da nota
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={disabled}
          fullWidth
          onClick={(event) => {
            event.stopPropagation();
            onSelectFile();
          }}
        >
          Escolher arquivo
        </Button>
      </div>
    </div>
  );
}

type UploadPreviewProps = {
  arquivo: File;
  previewUrl: string | null;
  onTrocar: () => void;
  onRemover: () => void;
};

export function UploadPreview({
  arquivo,
  previewUrl,
  onTrocar,
  onRemover,
}: UploadPreviewProps) {
  return (
    <div className="space-y-4">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Prévia da nota"
          className="max-h-72 w-full rounded-2xl border border-[var(--cedro-border)] bg-[var(--cedro-bg)] object-contain"
        />
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--cedro-border)] bg-[var(--cedro-bg)] p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--cedro-brown)] text-lg font-bold text-white">
            PDF
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-[var(--cedro-text)]">
              {arquivo.name}
            </p>
            <p className="mt-0.5 text-xs text-[var(--cedro-text-muted)]">
              {formatFileSize(arquivo.size)}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" fullWidth onClick={onTrocar}>
          Trocar arquivo
        </Button>
        <Button type="button" variant="danger" size="sm" fullWidth onClick={onRemover}>
          Remover
        </Button>
      </div>
    </div>
  );
}
