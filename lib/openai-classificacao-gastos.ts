import OpenAI from "openai";
import {
  CATEGORIAS_NOTA_FISCAL,
  ETAPAS_NOTA_FISCAL,
} from "@/lib/nota-fiscal-constants";
import { getOpenAIClient } from "@/lib/openai-client";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import {
  NOTA_FISCAL_IA_MODEL,
  NOTA_FISCAL_IA_MODEL_FALLBACK,
} from "@/lib/nota-fiscal-ia";
import type { SugestaoClassificacaoIA } from "@/lib/gastos-classificacao-motor";

const CLASSIFICACAO_PROMPT = `Você classifica produtos e serviços de construção civil brasileira.

Retorne APENAS JSON válido:
{
  "itens": [
    {
      "indice": 0,
      "categoria": "",
      "etapa": "",
      "confianca_categoria": 0,
      "confianca_etapa": 0
    }
  ]
}

CATEGORIAS PERMITIDAS: ${CATEGORIAS_NOTA_FISCAL.join(", ")}
ETAPAS PERMITIDAS: ${ETAPAS_NOTA_FISCAL.join(", ")}

Use confiança alta (≥ 0.85) quando evidente, baixa (~0.4) quando incerto.
Não invente categorias ou etapas fora das listas.`;

export async function classificarItensDesconhecidosComOpenAI(
  descricoes: string[]
): Promise<Map<number, SugestaoClassificacaoIA>> {
  const resultado = new Map<number, SugestaoClassificacaoIA>();

  if (descricoes.length === 0) {
    return resultado;
  }

  const openai = getOpenAIClient();
  const listaItens = descricoes
    .map((descricao, indice) => `${indice}: ${descricao}`)
    .join("\n");

  logNotaFiscal("openai.classificacao.inicio", {
    totalItens: descricoes.length,
  });

  const modelos = [
    NOTA_FISCAL_IA_MODEL,
    ...(NOTA_FISCAL_IA_MODEL !== NOTA_FISCAL_IA_MODEL_FALLBACK
      ? [NOTA_FISCAL_IA_MODEL_FALLBACK]
      : []),
  ];

  for (const model of modelos) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: CLASSIFICACAO_PROMPT },
          {
            role: "user",
            content: `Classifique os itens abaixo:\n${listaItens}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) continue;

      const parsed = JSON.parse(raw) as {
        itens?: Array<Record<string, unknown>>;
      };

      for (const item of parsed.itens ?? []) {
        const indice =
          typeof item.indice === "number" ? item.indice : Number(item.indice);
        if (!Number.isFinite(indice) || indice < 0 || indice >= descricoes.length) {
          continue;
        }

        resultado.set(indice, {
          categoria: item.categoria,
          etapa: item.etapa,
          confianca_categoria: item.confianca_categoria,
          confianca_etapa: item.confianca_etapa,
        });
      }

      logNotaFiscal("openai.classificacao.sucesso", {
        model,
        classificados: resultado.size,
      });

      return resultado;
    } catch (error) {
      logNotaFiscalError("openai.classificacao.erro", error, { model });
    }
  }

  return resultado;
}
