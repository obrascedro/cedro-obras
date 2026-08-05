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
            ? "border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-950"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Arraste e solte o arquivo aqui
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          ou clique para selecionar JPG, JPEG, PNG, WEBP ou PDF (até 10 MB)
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
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
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {selectedFile.type || "Tipo não identificado"} —{" "}
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Cancelar arquivo
            </button>
          </div>

          {previewUrl && isImageType(selectedFile.type) ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
            <img
              src={previewUrl}
              alt={`Prévia de ${selectedFile.name}`}
              className="mt-4 max-h-64 w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
            />
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                PDF
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Documento PDF selecionado
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
