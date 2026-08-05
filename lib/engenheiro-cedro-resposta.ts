import {
  gerarIndicadoresAutomaticos,
  responderCategoriasAcima,
  responderCompararObras,
  responderComprasSuspeitas,
  responderEconomizar,
  responderEtapaMaisCara,
  responderFornecedorTop,
  responderGastoEtapa,
  responderGastoTotalObra,
  responderLucratividade,
  responderNotasDuplicadas,
  responderObraMaiorLucro,
  responderOrcamentoRestante,
  responderOrcamentoSuficiente,
  responderResumoFinanceiro,
  responderRiscoPrejuizo,
  resolverObraContexto,
} from "@/lib/engenheiro-cedro-analytics";
import { carregarSnapshotEngenheiroCedro } from "@/lib/engenheiro-cedro-dados";
import {
  detectarIntent,
  extrairEtapaDaPergunta,
} from "@/lib/engenheiro-cedro-intents";
import type {
  RespostaEngenheiroCedro,
  SnapshotEngenheiroCedro,
} from "@/lib/engenheiro-cedro-types";
import { enriquecerRespostaComOpenAI } from "@/lib/openai-engenheiro-cedro";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function processarPerguntaEngenheiroCedro(
  client: SupabaseClient,
  pergunta: string,
  obraId?: string | null
): Promise<RespostaEngenheiroCedro> {
  const snapshot = await carregarSnapshotEngenheiroCedro(client);
  const obra = resolverObraContexto(snapshot, obraId, pergunta);
  const { intent, etapa } = detectarIntent(pergunta);

  let resposta = executarIntent(snapshot, intent, obra, etapa ?? extrairEtapaDaPergunta(pergunta));

  const indicadoresAuto = gerarIndicadoresAutomaticos(snapshot, obra);
  const idsExistentes = new Set(resposta.indicadores.map((i) => i.mensagem));
  for (const ind of indicadoresAuto) {
    if (!idsExistentes.has(ind.mensagem)) {
      resposta.indicadores.unshift(ind);
    }
  }

  if (intent === "analise_ia") {
    const enriquecida = await enriquecerRespostaComOpenAI(
      pergunta,
      resposta,
      snapshot,
      obra
    );
    if (enriquecida) {
      return {
        ...resposta,
        texto: enriquecida.texto,
        fonte: "ia",
        intent: "analise_ia",
      };
    }
  }

  return resposta;
}

function executarIntent(
  snapshot: SnapshotEngenheiroCedro,
  intent: string,
  obra: ReturnType<typeof resolverObraContexto>,
  etapa?: string
): RespostaEngenheiroCedro {
  switch (intent) {
    case "gasto_total_obra":
      return responderGastoTotalObra(snapshot, obra);
    case "gasto_etapa":
      return responderGastoEtapa(snapshot, obra, etapa ?? "Fundação");
    case "fornecedor_top":
    case "fornecedores_vendas":
      return responderFornecedorTop(snapshot, obra);
    case "orcamento_restante":
      return responderOrcamentoRestante(snapshot, obra);
    case "categorias_acima":
      return responderCategoriasAcima(snapshot, obra);
    case "obra_maior_lucro":
      return responderObraMaiorLucro(snapshot);
    case "compras_suspeitas":
      return responderComprasSuspeitas(snapshot);
    case "comparar_obras":
      return responderCompararObras(snapshot);
    case "etapa_mais_cara":
      return responderEtapaMaisCara(snapshot, obra);
    case "economizar":
      return responderEconomizar(snapshot, obra);
    case "notas_duplicadas":
      return responderNotasDuplicadas(snapshot);
    case "orcamento_suficiente":
      return responderOrcamentoSuficiente(snapshot, obra);
    case "lucratividade":
      return responderLucratividade(snapshot);
    case "risco_prejuizo":
      return responderRiscoPrejuizo(snapshot, obra);
    case "resumo_financeiro":
      return responderResumoFinanceiro(snapshot);
    default:
      return responderResumoFinanceiro(snapshot);
  }
}
