export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

export function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
