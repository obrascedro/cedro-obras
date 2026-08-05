"use client";

import { DragEvent } from "react";
import {
  formatFileSize,
  isImageType,
  NOTAS_FISCAIS_ACCEPTED_EXTENSIONS,
} from "@/lib/notas-fiscais";

type NotaFiscalUploadZoneProps = {
  selectedFile: File | null;
  previewUrl: string | null;
  isDragging: boolean;
  onFileSelect: (file: File | null) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

const acceptValue = [
  ...NOTAS_FISCAIS_ACCEPTED_EXTENSIONS,
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
].join(",");

export default function NotaFiscalUploadZone({
  selectedFile,
  previewUrl,
  isDragging,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: NotaFiscalUploadZoneProps) {
  return (
    <>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? "border-[var(--cedro-brown)] bg-[var(--cedro-bg)]"
            : "border-[var(--cedro-border)]"
        }`}
      >
        <p className="text-sm font-medium text-[var(--cedro-text)]">
          Arraste e solte o arquivo aqui
        </p>
        <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
          ou clique para selecionar JPG, JPEG, PNG, WEBP ou PDF (até 10 MB)
        </p>
        <label className="cedro-btn-primary mt-4 inline-flex cursor-pointer items-center justify-center px-4 py-2.5 text-sm">
          Selecionar arquivo
          <input
            type="file"
            accept={acceptValue}
            className="hidden"
            onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {selectedFile ? (
        <div className="mt-4 rounded-xl border border-[var(--cedro-border)] bg-[var(--cedro-bg)] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--cedro-text)]">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
                {selectedFile.type || "Tipo não identificado"} —{" "}
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="text-sm font-medium text-[var(--cedro-error)] transition-colors hover:text-[var(--cedro-brown-dark)]"
            >
              Cancelar arquivo
            </button>
          </div>

          {previewUrl && isImageType(selectedFile.type) ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
            <img
              src={previewUrl}
              alt={`Prévia de ${selectedFile.name}`}
              className="mt-4 max-h-64 w-full rounded-lg border border-[var(--cedro-border)] object-contain"
            />
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--cedro-border)] bg-[var(--cedro-surface)] px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cedro-bg)] text-[var(--cedro-text)]">
                PDF
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--cedro-text)]">
                  Documento PDF selecionado
                </p>
                <p className="text-xs text-[var(--cedro-text-muted)]">
                  A prévia visual não está disponível para PDF.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
