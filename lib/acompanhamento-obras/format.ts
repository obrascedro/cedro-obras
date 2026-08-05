import { formatDate } from "@/lib/format";

export function resumirObservacao(
  texto: string | null | undefined,
  max = 120
): string {
  const t = texto?.trim() ?? "";
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function formatDataAtualizacao(data: string): string {
  return formatDate(data);
}

export function formatDataHoraEnvio(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
