import {
  ACOMPANHAMENTO_ACCEPTED_EXTENSIONS,
  ACOMPANHAMENTO_ACCEPTED_TYPES,
  ACOMPANHAMENTO_MAX_FOTOS,
  ACOMPANHAMENTO_MAX_SIZE_BYTES,
  ACOMPANHAMENTO_MSG,
} from "@/lib/acompanhamento-obras/config";

const EXT_POR_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type FotoAcompanhamentoValidada = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  fileSize: number;
  nomeOriginal: string;
};

function extensaoSegura(nome: string): string {
  const ext = nome.slice(nome.lastIndexOf(".")).toLowerCase();
  if (
    ACOMPANHAMENTO_ACCEPTED_EXTENSIONS.includes(
      ext as (typeof ACOMPANHAMENTO_ACCEPTED_EXTENSIONS)[number]
    )
  ) {
    return ext;
  }
  return ".bin";
}

function mimePorExtensao(ext: string): string | null {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return map[ext] ?? null;
}

export function validarMetaFotoAcompanhamento(file: File): Omit<
  FotoAcompanhamentoValidada,
  "buffer"
> {
  if (!file || file.size === 0) {
    throw new Error(ACOMPANHAMENTO_MSG.semFotos);
  }

  if (file.size > ACOMPANHAMENTO_MAX_SIZE_BYTES) {
    throw new Error(ACOMPANHAMENTO_MSG.arquivoGrande);
  }

  const ext = extensaoSegura(file.name);
  const mimeInformado = file.type?.split(";")[0].trim().toLowerCase() ?? "";
  const mimePorExt = mimePorExtensao(ext);

  let mimeType = mimeInformado;
  if (
    !ACOMPANHAMENTO_ACCEPTED_TYPES.includes(
      mimeType as (typeof ACOMPANHAMENTO_ACCEPTED_TYPES)[number]
    )
  ) {
    mimeType = mimePorExt ?? mimeType;
  }

  if (
    !ACOMPANHAMENTO_ACCEPTED_TYPES.includes(
      mimeType as (typeof ACOMPANHAMENTO_ACCEPTED_TYPES)[number]
    )
  ) {
    throw new Error(ACOMPANHAMENTO_MSG.tipoInvalido);
  }

  const extEsperada = EXT_POR_MIME[mimeType];
  const nomeBase =
    file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "foto-obra";
  const fileName = `${nomeBase}${extEsperada ?? ext}`;

  return {
    mimeType,
    fileName,
    fileSize: file.size,
    nomeOriginal: file.name,
  };
}

export async function lerFotosAcompanhamento(
  files: File[]
): Promise<FotoAcompanhamentoValidada[]> {
  if (files.length === 0) {
    throw new Error(ACOMPANHAMENTO_MSG.semFotos);
  }

  if (files.length > ACOMPANHAMENTO_MAX_FOTOS) {
    throw new Error(ACOMPANHAMENTO_MSG.maxFotos);
  }

  const validadas: FotoAcompanhamentoValidada[] = [];

  for (const file of files) {
    const meta = validarMetaFotoAcompanhamento(file);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > ACOMPANHAMENTO_MAX_SIZE_BYTES) {
      throw new Error(ACOMPANHAMENTO_MSG.arquivoGrande);
    }

    validadas.push({ ...meta, buffer, fileSize: buffer.length });
  }

  return validadas;
}

export function isFotoAcompanhamentoAceita(file: File): boolean {
  try {
    validarMetaFotoAcompanhamento(file);
    return true;
  } catch {
    return false;
  }
}
