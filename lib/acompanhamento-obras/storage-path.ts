import { sanitizeFileName } from "@/lib/notas-fiscais";

export function buildAcompanhamentoStoragePath(
  obraId: string,
  acompanhamentoId: string,
  fileName: string
): string {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const safe = sanitizeFileName(fileName);
  const stamp = Date.now();
  return `${obraId}/${ano}/${mes}/${acompanhamentoId}/${stamp}-${safe}`;
}
