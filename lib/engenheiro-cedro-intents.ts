import type { IntentEngenheiroCedro } from "@/lib/engenheiro-cedro-types";

const ETAPAS_KEYWORDS: Record<string, string[]> = {
  fundação: ["fundacao", "fundação", "concreto", "sapata", "estaca"],
  alvenaria: ["alvenaria", "tijolo", "bloco"],
  cobertura: ["cobertura", "telha", "telhado"],
  "instalações elétricas": ["eletrica", "elétrica", "eletrico", "fio", "cabo"],
  "instalações hidráulicas": ["hidraulica", "hidráulica", "tubo", "encanamento"],
  impermeabilização: ["impermeabilizacao", "impermeabilização", "manta"],
  pintura: ["pintura", "tinta"],
  revestimentos: ["revestimento", "ceramica", "cerâmica", "porcelanato"],
  pisos: ["piso", "porcelanato"],
  acabamento: ["acabamento", "gesso"],
  superestrutura: ["superestrutura", "estrutura", "laje", "viga", "pilar"],
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function detectarIntent(pergunta: string): {
  intent: IntentEngenheiroCedro;
  etapa?: string;
} {
  const texto = normalizar(pergunta);

  if (
    /nota.*duplic|duplic.*nota|notas repetidas|nota repetida/.test(texto)
  ) {
    return { intent: "notas_duplicadas" };
  }

  if (
    /compras? suspeit|gastos? suspeit|algo errado|anomalia/.test(texto)
  ) {
    return { intent: "compras_suspeitas" };
  }

  if (/economizar|economia|reduzir custo|onde posso economizar/.test(texto)) {
    return { intent: "economizar" };
  }

  if (/compar|versus|vs\.| x /.test(texto) && /obra/.test(texto)) {
    return { intent: "comparar_obras" };
  }

  if (
    /risco.*preju|prejuizo|prejuízo|estouro|falencia|falência/.test(texto)
  ) {
    return { intent: "risco_prejuizo" };
  }

  if (
    /orcamento.*suficient|orçamento.*suficient|vai dar|da para terminar|dá para terminar/.test(
      texto
    )
  ) {
    return { intent: "orcamento_suficiente" };
  }

  if (
    /falta.*orcamento|falta.*orçamento|quanto falta|saldo.*orcamento|restante.*orcamento/.test(
      texto
    )
  ) {
    return { intent: "orcamento_restante" };
  }

  if (
    /categorias?.*acima|acima.*previsto|estour.*categoria/.test(texto)
  ) {
    return { intent: "categorias_acima" };
  }

  if (
    /maior lucro|mais lucrat|obra.*lucrat|qual obra.*lucro/.test(texto)
  ) {
    return { intent: "obra_maior_lucro" };
  }

  if (/lucrativ|margem|rentabil/.test(texto)) {
    return { intent: "lucratividade" };
  }

  if (
    /fornecedor.*mais|mais.*fornecedor|quem.*recebeu|fornecedores.*vendem|fornecedores.*venderam/.test(
      texto
    )
  ) {
    return { intent: "fornecedor_top" };
  }

  if (
    /etapa.*consum|consum.*etapa|etapa.*cara|etapa.*gasta|mais dinheiro.*etapa/.test(
      texto
    )
  ) {
    return { intent: "etapa_mais_cara" };
  }

  for (const [etapa, keywords] of Object.entries(ETAPAS_KEYWORDS)) {
    if (keywords.some((k) => texto.includes(normalizar(k)))) {
      if (/gast|gastei|quanto|valor|total|cust/.test(texto)) {
        return { intent: "gasto_etapa", etapa };
      }
    }
  }

  if (
    /quanto.*gast|gast.*total|gastei|gasto realizado|quanto ja|quanto já/.test(
      texto
    )
  ) {
    return { intent: "gasto_total_obra" };
  }

  if (/resumo|panorama|visao geral|visão geral|como estao|como estão/.test(texto)) {
    return { intent: "resumo_financeiro" };
  }

  return { intent: "analise_ia" };
}

export function extrairEtapaDaPergunta(pergunta: string): string | undefined {
  const texto = normalizar(pergunta);
  for (const [etapa, keywords] of Object.entries(ETAPAS_KEYWORDS)) {
    if (keywords.some((k) => texto.includes(normalizar(k)))) {
      return etapa.charAt(0).toUpperCase() + etapa.slice(1);
    }
  }
  return undefined;
}
