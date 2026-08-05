"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AcompanhamentoFoto } from "@/lib/acompanhamento-obras/types";

type AcompanhamentoFotoLazyProps = {
  foto: AcompanhamentoFoto;
  obterUrl: (path: string) => Promise<{ url?: string; erro?: string }>;
  onClick: () => void;
};

export default function AcompanhamentoFotoLazy({
  foto,
  obterUrl,
  onClick,
}: AcompanhamentoFotoLazyProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelado = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || url || carregando) return;

        async function carregar() {
          setCarregando(true);
          const result = await obterUrl(foto.storage_path);
          if (cancelado) return;
          if (result.url) {
            setUrl(result.url);
          } else {
            setErro(result.erro ?? "Erro ao carregar");
          }
          setCarregando(false);
        }

        void carregar();
        observer.disconnect();
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => {
      cancelado = true;
      observer.disconnect();
    };
  }, [foto.storage_path, obterUrl, url, carregando]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label={foto.nome_original ?? "Abrir foto"}
    >
      {carregando ? (
        <span className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </span>
      ) : erro ? (
        <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-red-500">
          {erro}
        </span>
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={foto.nome_original ?? "Foto da obra"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
          …
        </span>
      )}
    </button>
  );
}
