/** Status permitidos no fluxo de notas fiscais. */
export const NOTAS_FISCAIS_STATUS = [
  "aguardando",
  "processando",
  "pendente_aprovacao",
  "correcao_solicitada",
  "aprovada",
  "rejeitada",
  "erro",
  /** @deprecated Use pendente_aprovacao */
  "revisar",
  /** @deprecated Use aprovada */
  "confirmado",
] as const;

export type NotaFiscalStatus = (typeof NOTAS_FISCAIS_STATUS)[number];

export const STATUS_PENDENTE_APROVACAO = "pendente_aprovacao" as const;
export const STATUS_APROVADA = "aprovada" as const;

export function normalizarStatusNota(status: string): string {
  if (status === "confirmado") return STATUS_APROVADA;
  if (status === "revisar" || status === "processado") {
    return STATUS_PENDENTE_APROVACAO;
  }
  return status;
}

export function isPendenteAprovacao(status: string): boolean {
  const s = normalizarStatusNota(status);
  return s === STATUS_PENDENTE_APROVACAO;
}

export function isAprovada(status: string): boolean {
  return normalizarStatusNota(status) === STATUS_APROVADA;
}

export function isCorrecaoSolicitada(status: string): boolean {
  return status === "correcao_solicitada";
}

export function isRejeitada(status: string): boolean {
  return status === "rejeitada";
}

export function podeAprovar(status: string): boolean {
  return isPendenteAprovacao(status);
}

export function formatStatusLabel(status: string): string {
  switch (normalizarStatusNota(status)) {
    case "aguardando":
      return "Aguardando";
    case "processando":
      return "Processando";
    case "pendente_aprovacao":
      return "Pendente aprovação";
    case "correcao_solicitada":
      return "Correção solicitada";
    case "aprovada":
      return "Aprovada";
    case "rejeitada":
      return "Rejeitada";
    case "erro":
      return "Erro";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function statusNotaBadgeClass(status: string): string {
  switch (normalizarStatusNota(status)) {
    case "processando":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300";
    case "pendente_aprovacao":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300";
    case "correcao_solicitada":
      return "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/40 dark:text-orange-300";
    case "aprovada":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "rejeitada":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    case "erro":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300";
  }
}
