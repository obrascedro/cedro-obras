/** Converte texto monetário pt-BR (ex.: 1.234,56) em número. */
export function parseMoedaBr(valor: string): number {
  const limpo = valor
    .trim()
    .replace(/\s/g, "")
    .replace(/^R\$\s?/i, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!limpo) return 0;
  const n = Number(limpo);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Formata número para exibição em input (sem símbolo R$). */
export function formatMoedaBrInput(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Máscara leve enquanto digita — mantém apenas dígitos e formata como centavos. */
export function mascaraMoedaBrDigitando(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = Number(digits);
  return formatMoedaBrInput(cents / 100);
}
