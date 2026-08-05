/** Status permitidos para obras — compartilhado entre formulários. */
export const STATUS_OBRA = [
  "Planejamento",
  "Em andamento",
  "Pausada",
  "Concluída",
  "Cancelada",
] as const;

export type StatusObra = (typeof STATUS_OBRA)[number];

export function isStatusObraValido(valor: string): valor is StatusObra {
  return (STATUS_OBRA as readonly string[]).includes(valor);
}
