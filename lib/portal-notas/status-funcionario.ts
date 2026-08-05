import { normalizarStatusNota } from "@/lib/notas-fiscais-status";

/** Rótulos amigáveis para funcionários (sem jargão técnico). */
export function formatStatusFuncionario(status: string): string {
  switch (normalizarStatusNota(status)) {
    case "aguardando":
      return "Recebida";
    case "processando":
      return "Em análise";
    case "pendente_aprovacao":
      return "Aguardando aprovação";
    case "correcao_solicitada":
      return "Aguardando aprovação";
    case "aprovada":
      return "Aprovada";
    case "rejeitada":
      return "Rejeitada";
    case "erro":
      return "Erro no processamento";
    default:
      return "Em análise";
  }
}

export function statusFuncionarioBadgeClass(status: string): string {
  switch (normalizarStatusNota(status)) {
    case "aguardando":
      return "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300";
    case "processando":
      return "bg-blue-50 text-blue-800 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300";
    case "pendente_aprovacao":
    case "correcao_solicitada":
      return "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300";
    case "aprovada":
      return "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "rejeitada":
      return "bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    case "erro":
      return "bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export type FiltroMinhasNotas =
  | "todas"
  | "em_analise"
  | "aguardando_aprovacao"
  | "aprovadas"
  | "rejeitadas";

export const FILTROS_MINHAS_NOTAS: {
  id: FiltroMinhasNotas;
  label: string;
}[] = [
  { id: "todas", label: "Todas" },
  { id: "em_analise", label: "Em análise" },
  { id: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { id: "aprovadas", label: "Aprovadas" },
  { id: "rejeitadas", label: "Rejeitadas" },
];

export function notaPassaFiltroFuncionario(
  status: string,
  filtro: FiltroMinhasNotas
): boolean {
  if (filtro === "todas") return true;
  const s = normalizarStatusNota(status);
  switch (filtro) {
    case "em_analise":
      return s === "aguardando" || s === "processando" || status === "erro";
    case "aguardando_aprovacao":
      return s === "pendente_aprovacao" || status === "correcao_solicitada";
    case "aprovadas":
      return s === "aprovada";
    case "rejeitadas":
      return s === "rejeitada";
    default:
      return true;
  }
}

export function formatReferenciaNota(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function formatDataHoraEnvio(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
