import OpenAI from "openai";
import {
  NOTA_FISCAL_EXTRACAO_PROMPT,
  NOTA_FISCAL_IA_MODEL,
  NOTA_FISCAL_IA_MODEL_FALLBACK,
  enriquecerLeituraComClassificacaoIA,
  parseNotaFiscalLeitura,
  type NotaFiscalLeitura,
} from "@/lib/nota-fiscal-ia";
import type { ContextoClassificacao } from "@/lib/nota-fiscal-classificacao";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import {
  logOpenAIError,
  logParseResult,
  safeParseNotaFiscalJson,
} from "@/lib/nota-fiscal-parse";
import { isImageType } from "@/lib/notas-fiscais";
import { getOpenAIClient } from "@/lib/openai-client";

export { getOpenAIClient };

type VisionInput = {
  mimeType: string;
  fileName: string;
  base64: string;
};

function buildFileContent({ mimeType, fileName, base64 }: VisionInput) {
  const dataUrl = `data:${mimeType};base64,${base64}`;

  if (isImageType(mimeType)) {
    return {
      type: "image_url" as const,
      image_url: { url: dataUrl, detail: "high" as const },
    };
  }

  return {
    type: "file" as const,
    file: {
      filename: fileName,
      file_data: dataUrl,
    },
  };
}

async function extrairNotaFiscal(
  openai: OpenAI,
  model: string,
  input: VisionInput,
  contexto?: ContextoClassificacao
): Promise<NotaFiscalLeitura> {
  logNotaFiscal("openai.extracao.inicio", {
    model,
    mimeType: input.mimeType,
    fileName: input.fileName,
    tamanhoBase64: input.base64.length,
  });

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: NOTA_FISCAL_EXTRACAO_PROMPT },
          buildFileContent(input),
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const rawContent = completion.choices[0]?.message?.content;

  logNotaFiscal("openai.extracao.recebida", {
    model,
    finishReason: completion.choices[0]?.finish_reason,
    temConteudo: Boolean(rawContent),
  });

  if (!rawContent) {
    throw new Error("A IA não retornou conteúdo para esta nota fiscal.");
  }

  const jsonParsed = safeParseNotaFiscalJson(rawContent);
  const leituraBase = parseNotaFiscalLeitura(jsonParsed, contexto);

  const itensConhecidos = leituraBase.itens.filter(
    (item) =>
      item.fonte_classificacao === "catalogo" ||
      item.fonte_classificacao === "aprendida"
  ).length;

  logNotaFiscal("openai.extracao.classificacao.local", {
    totalItens: leituraBase.itens.length,
    conhecidosCatalogoOuAprendido: itensConhecidos,
    precisamIA: leituraBase.itens.length - itensConhecidos,
  });

  const leitura = await enriquecerLeituraComClassificacaoIA(
    leituraBase,
    contexto
  );

  logParseResult(leitura);

  return leitura;
}

export async function lerNotaFiscalComOpenAI(
  input: VisionInput,
  contexto?: ContextoClassificacao
): Promise<NotaFiscalLeitura> {
  const openai = getOpenAIClient();

  try {
    return await extrairNotaFiscal(openai, NOTA_FISCAL_IA_MODEL, input, contexto);
  } catch (primaryError) {
    logOpenAIError(NOTA_FISCAL_IA_MODEL, primaryError);

    if (NOTA_FISCAL_IA_MODEL === NOTA_FISCAL_IA_MODEL_FALLBACK) {
      throw primaryError;
    }

    logNotaFiscal("openai.fallback", {
      de: NOTA_FISCAL_IA_MODEL,
      para: NOTA_FISCAL_IA_MODEL_FALLBACK,
    });

    try {
      return await extrairNotaFiscal(
        openai,
        NOTA_FISCAL_IA_MODEL_FALLBACK,
        input,
        contexto
      );
    } catch (fallbackError) {
      logNotaFiscalError("openai.fallback.erro", fallbackError);
      throw fallbackError;
    }
  }
}
