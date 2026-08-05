import { getOpenAIClient } from "@/lib/openai-client";
import { formatCurrency } from "@/lib/format";
import type {
  ObraResumo,
  RespostaEngenheiroCedro,
  SnapshotEngenheiroCedro,
} from "@/lib/engenheiro-cedro-types";

const MODELO =
  process.env.OPENAI_ASSISTENTE_MODEL ??
  process.env.OPENAI_NOTA_FISCAL_MODEL ??
  "gpt-4.1";

function montarContextoCompacto(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): string {
  const linhasObras = snapshot.obras
    .slice(0, 12)
    .map(
      (o) =>
        `- ${o.nome} (${o.status}): orçamento ${formatCurrency(o.orcamento_previsto)}, gasto ${formatCurrency(o.gasto_realizado)}, lucro ${formatCurrency(o.lucro_estimado)}`
    )
    .join("\n");

  const topFornecedores = new Map<string, number>();
  for (const g of snapshot.gastos) {
    const f = g.fornecedor ?? "Sem fornecedor";
    topFornecedores.set(f, (topFornecedores.get(f) ?? 0) + g.valor_total);
  }
  const fornecedores = Array.from(topFornecedores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nome, total]) => `${nome}: ${formatCurrency(total)}`)
    .join("; ");

  return `
DADOS CALCULADOS DO SISTEMA (use estes números, não invente):
- Obras: ${snapshot.obras.length}
- Gasto geral: ${formatCurrency(snapshot.totais.gastoGeral)}
- Recebido geral: ${formatCurrency(snapshot.totais.recebidoGeral)}
- Lucro geral: ${formatCurrency(snapshot.totais.lucroGeral)}
- Orçamento geral: ${formatCurrency(snapshot.totais.orcamentoGeral)}
- Lançamentos de gastos: ${snapshot.gastos.length}
- Notas fiscais: ${snapshot.notas.length}
- Classificações aprendidas: ${snapshot.classificacoesAprendidas.length}

Obras:
${linhasObras}

Top fornecedores: ${fornecedores || "nenhum"}

${obra ? `Obra em foco: ${obra.nome} — gasto ${formatCurrency(obra.gasto_realizado)}, orçamento ${formatCurrency(obra.orcamento_previsto)}` : ""}
`.trim();
}

export async function enriquecerRespostaComOpenAI(
  pergunta: string,
  respostaBase: RespostaEngenheiroCedro,
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): Promise<{ texto: string } | null> {
  try {
    const openai = getOpenAIClient();
    const contexto = montarContextoCompacto(snapshot, obra);

    const completion = await openai.chat.completions.create({
      model: MODELO,
      messages: [
        {
          role: "system",
          content: `Você é o Engenheiro Cedro, gerente financeiro especializado em construção civil no sistema Cedro Obras.

REGRAS:
- NUNCA recalcule valores — use apenas os números fornecidos no contexto e na resposta base.
- Responda em português brasileiro, de forma clara e profissional.
- Seja conciso (máximo 3 parágrafos curtos).
- Pode usar **negrito** para destacar valores.
- Se a resposta base já responde completamente, reformule de forma mais natural sem alterar os números.
- Para recomendações, baseie-se nos dados reais.
- Não invente obras, fornecedores ou valores que não estejam no contexto.

${contexto}`,
        },
        {
          role: "user",
          content: `Pergunta do usuário: ${pergunta}

Resposta calculada pelo sistema (dados reais — preserve os números):
${respostaBase.texto}

Intent detectado: ${respostaBase.intent}

Reformule e enriqueça esta resposta. Se for análise ou recomendação, explique tendências e sugira ações práticas.`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const texto = completion.choices[0]?.message?.content?.trim();
    if (!texto) return null;

    return { texto };
  } catch {
    return null;
  }
}

export async function gerarRespostaOpenAIPura(
  pergunta: string,
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): Promise<string> {
  const enriquecida = await enriquecerRespostaComOpenAI(
    pergunta,
    {
      texto: "Análise solicitada pelo usuário.",
      indicadores: [],
      graficos: [],
      fonte: "dados",
      intent: "analise_ia",
    },
    snapshot,
    obra
  );
  return enriquecida?.texto ?? "Não consegui processar sua pergunta no momento. Tente reformular ou verifique a conexão.";
}
