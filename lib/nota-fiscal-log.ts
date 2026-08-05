type LogContext = Record<string, unknown>;

const PREFIX = "[NotaFiscal]";

/** Logs exclusivos do servidor — não executam no navegador. */
export function logNotaFiscal(
  etapa: string,
  context?: LogContext,
  level: "log" | "warn" | "error" = "log"
) {
  if (typeof window !== "undefined") {
    return;
  }

  const message = `${PREFIX} ${etapa}`;
  const payload = context ? { etapa, ...context } : { etapa };

  if (level === "error") {
    console.error(message, payload);
    return;
  }

  if (level === "warn") {
    console.warn(message, payload);
    return;
  }

  console.log(message, payload);
}

export function logNotaFiscalError(
  etapa: string,
  error: unknown,
  context?: LogContext
) {
  logNotaFiscal(
    etapa,
    {
      ...context,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    },
    "error"
  );
}
