"use client";

import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  obterUrlFotoAcompanhamentoAdminAction,
} from "@/app/actions/admin-acompanhamento";
import type { AcompanhamentoFoto } from "@/lib/acompanhamento-obras/types";

type AcompanhamentoGaleriaModalProps = {
  fotos: AcompanhamentoFoto[];
  titulo: string;
  indiceInicial?: number;
  onFechar: () => void;
  obterUrl: (path: string) => Promise<{ url?: string; erro?: string }>;
};

export default function AcompanhamentoGaleriaModal({
  fotos,
  titulo,
  indiceInicial = 0,
  onFechar,
  obterUrl,
}: AcompanhamentoGaleriaModalProps) {
  const [indice, setIndice] = useState(indiceInicial);
  const [url, setUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fotoAtual = fotos[indice];

  useEffect(() => {
    if (!fotoAtual) return;
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      setUrl(null);
      const result = await obterUrl(fotoAtual.storage_path);
      if (cancelado) return;
      if (result.url) {
        setUrl(result.url);
      } else {
        setErro(result.erro ?? "Não foi possível carregar a imagem.");
      }
      setCarregando(false);
    }

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [fotoAtual, obterUrl]);

  if (!fotoAtual) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0 pr-4">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {titulo}
            </p>
            <p className="text-xs text-zinc-500">
              Foto {indice + 1} de {fotos.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-[280px] flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          {carregando ? (
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          ) : erro ? (
            <p className="px-4 text-center text-sm text-red-600">{erro}</p>
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={fotoAtual.nome_original ?? "Foto da obra"}
              className="max-h-[60vh] max-w-full object-contain"
            />
          ) : null}

          {fotos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIndice((i) => (i > 0 ? i - 1 : fotos.length - 1))}
                className="absolute left-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIndice((i) => (i < fotos.length - 1 ? i + 1 : 0))}
                className="absolute right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="truncate text-xs text-zinc-500">
            {fotoAtual.nome_original ?? fotoAtual.storage_path}
          </p>
          {url ? (
            <a
              href={url}
              download={fotoAtual.nome_original ?? "foto-obra.jpg"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function galeriaObterUrlAdmin(path: string) {
  return obterUrlFotoAcompanhamentoAdminAction(path);
}
