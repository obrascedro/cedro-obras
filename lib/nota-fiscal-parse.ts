import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";

/** Extrai JSON válido mesmo quando a IA envolve em markdown ou texto extra. */
export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // continua para estratégias alternativas
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error("Não foi possível extrair JSON da resposta da IA.");
}

export function safeParseNotaFiscalJson(rawContent: string) {
  logNotaFiscal("parsing.resposta_bruta", {
    tamanho: rawContent.length,
    preview: rawContent.slice(0, 300),
  });

  const parsed = extractJsonFromText(rawContent);

  logNotaFiscal("parsing.json_extraido", {
    chaves:
      parsed && typeof parsed === "object"
        ? Object.keys(parsed as Record<string, unknown>)
        : [],
  });

  return parsed;
}

export function logParseResult(leitura: unknown) {
  if (!leitura || typeof leitura !== "object") {
    logNotaFiscal("parsing.resultado_invalido", { leitura }, "warn");
    return;
  }

  const data = leitura as Record<string, unknown>;
  const itens = Array.isArray(data.itens)
    ? data.itens
    : Array.isArray(data.produtos)
      ? data.produtos
      : [];

  logNotaFiscal("parsing.resultado", {
    fornecedor: data.fornecedor,
    cnpj: data.cnpj,
    data: data.data,
    valor_total: data.valor_total,
    total_itens: itens.length,
  });
}

export function logOpenAIError(model: string, error: unknown) {
  logNotaFiscalError("openai.erro_modelo", error, { model });
}
