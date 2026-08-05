/** Detecta fotos HEIC/HEIF comuns em iPhones. */
export function isHeicFile(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const type = (file.type ?? "").split(";")[0].trim().toLowerCase();
  return (
    ext === ".heic" ||
    ext === ".heif" ||
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence"
  );
}

export const MSG_FORMATO_HEIC =
  "Formato HEIC/HEIF não é suportado. No iPhone, use Ajustes → Câmera → Formatos → Mais compatível (JPEG), ou envie JPG/PNG.";

export const MSG_FORMATO_NAO_SUPORTADO =
  "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF.";
