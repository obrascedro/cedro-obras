export const NOTAS_FISCAIS_BUCKET = "notas-fiscais";

export const NOTAS_FISCAIS_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const NOTAS_FISCAIS_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const NOTAS_FISCAIS_ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
] as const;

export {
  NOTAS_FISCAIS_STATUS,
  formatStatusLabel,
  statusNotaBadgeClass,
  isPendenteAprovacao,
  isAprovada,
  isCorrecaoSolicitada,
} from "@/lib/notas-fiscais-status";

export type NotaFiscal = {
  id: string;
  obra_id: string;
  arquivo_path: string;
  arquivo_nome: string;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  fornecedor: string | null;
  data_nota: string | null;
  valor_total: number | null;
  observacoes: string | null;
  origem: string;
  status_processamento: string;
  criado_em: string;
  enviado_por?: string | null;
  enviado_por_nome?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  rejeitado_por_nome?: string | null;
  rejeitado_em?: string | null;
  motivo_rejeicao?: string | null;
  mensagem_correcao?: string | null;
  leitura_json?: unknown;
  itens_json?: unknown;
  obras: { nome: string } | { nome: string }[] | null;
};

export type ObraOption = {
  id: string;
  nome: string;
};

export function getObraNomeNota(
  obras: NotaFiscal["obras"]
): string {
  if (!obras) return "—";
  if (Array.isArray(obras)) return obras[0]?.nome ?? "—";
  return obras.nome;
}

export function formatOrigemNota(origem: string): string {
  switch (origem) {
    case "portal_funcionario":
      return "Portal do funcionário";
    case "whatsapp":
      return "WhatsApp";
    case "manual":
      return "Manual";
    case "ia":
      return "IA";
    default:
      return origem.charAt(0).toUpperCase() + origem.slice(1);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function buildStoragePath(obraId: string, fileName: string): string {
  const uniqueName = `${Date.now()}-${sanitizeFileName(fileName)}`;
  return `${obraId}/${uniqueName}`;
}

export function isAcceptedFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return (
    NOTAS_FISCAIS_ACCEPTED_TYPES.includes(
      file.type as (typeof NOTAS_FISCAIS_ACCEPTED_TYPES)[number]
    ) || NOTAS_FISCAIS_ACCEPTED_EXTENSIONS.includes(
      extension as (typeof NOTAS_FISCAIS_ACCEPTED_EXTENSIONS)[number]
    )
  );
}

export function isImageType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}
