export const ACOMPANHAMENTO_OBRAS_BUCKET = "acompanhamento-obras";

export const ACOMPANHAMENTO_MAX_FOTOS = 10;
export const ACOMPANHAMENTO_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const ACOMPANHAMENTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ACOMPANHAMENTO_ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export const ACOMPANHAMENTO_MSG = {
  erroGenerico: "Não foi possível enviar as fotos. Tente novamente.",
  obraNaoAutorizada: "Você não possui acesso a esta obra.",
  semFotos: "Selecione pelo menos uma foto.",
  arquivoGrande: "A imagem excede o tamanho permitido.",
  tipoInvalido: "Formato não permitido. Use JPG, PNG ou WEBP.",
  maxFotos: `Envie no máximo ${ACOMPANHAMENTO_MAX_FOTOS} fotos por atualização.`,
} as const;
