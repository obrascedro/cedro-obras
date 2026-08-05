import {
  NOTAS_FISCAIS_ACCEPTED_EXTENSIONS,
  NOTAS_FISCAIS_ACCEPTED_TYPES,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
} from "@/lib/notas-fiscais";

const EXT_POR_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export type ArquivoPortalValidado = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  fileSize: number;
};

function extensaoSegura(nome: string): string {
  const ext = nome.slice(nome.lastIndexOf(".")).toLowerCase();
  if (
    NOTAS_FISCAIS_ACCEPTED_EXTENSIONS.includes(
      ext as (typeof NOTAS_FISCAIS_ACCEPTED_EXTENSIONS)[number]
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
    ".pdf": "application/pdf",
  };
  return map[ext] ?? null;
}

export function validarArquivoPortalNotas(
  file: File
): ArquivoPortalValidado {
  if (!file || file.size === 0) {
    throw new Error("Selecione um arquivo para enviar.");
  }

  if (file.size > NOTAS_FISCAIS_MAX_SIZE_BYTES) {
    throw new Error("Arquivo excede o limite de 10 MB.");
  }

  const ext = extensaoSegura(file.name);
  const mimeInformado = file.type?.split(";")[0].trim().toLowerCase() ?? "";
  const mimePorExt = mimePorExtensao(ext);

  let mimeType = mimeInformado;
  if (
    !NOTAS_FISCAIS_ACCEPTED_TYPES.includes(
      mimeType as (typeof NOTAS_FISCAIS_ACCEPTED_TYPES)[number]
    )
  ) {
    mimeType = mimePorExt ?? mimeType;
  }

  if (
    !NOTAS_FISCAIS_ACCEPTED_TYPES.includes(
      mimeType as (typeof NOTAS_FISCAIS_ACCEPTED_TYPES)[number]
    )
  ) {
    throw new Error(
      "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF."
    );
  }

  const extEsperada = EXT_POR_MIME[mimeType];
  const nomeBase =
    file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "nota-portal";
  const fileName = `${nomeBase}${extEsperada ?? ext}`;

  return {
    buffer: Buffer.from([]),
    mimeType,
    fileName,
    fileSize: file.size,
  };
}

export async function lerBufferArquivoPortal(
  file: File
): Promise<ArquivoPortalValidado> {
  const meta = validarArquivoPortalNotas(file);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > NOTAS_FISCAIS_MAX_SIZE_BYTES) {
    throw new Error("Arquivo excede o limite de 10 MB.");
  }

  return { ...meta, buffer, fileSize: buffer.length };
}
