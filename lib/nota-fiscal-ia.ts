import {
  CATEGORIAS_NOTA_FISCAL,
  ETAPAS_NOTA_FISCAL,
} from "@/lib/nota-fiscal-constants";
import { enriquecerClassificacaoItem } from "@/lib/nota-fiscal-classificacao";
import type { ContextoClassificacao } from "@/lib/nota-fiscal-classificacao";
import type { FonteClassificacao } from "@/lib/nota-fiscal-normalizacao";
import { precisaClassificacaoIA } from "@/lib/gastos-classificacao-motor";
import { classificarItensDesconhecidosComOpenAI } from "@/lib/openai-classificacao-gastos";

/** Modelo padrão para leitura de notas fiscais (Vision). Sobrescreva via env. */
export const NOTA_FISCAL_IA_MODEL =
  process.env.OPENAI_NOTA_FISCAL_MODEL ?? "gpt-4.1";

export const NOTA_FISCAL_IA_MODEL_FALLBACK = "gpt-4o";

/** Prompt focado em extração — classificação é feita pelo motor interno. */
export const NOTA_FISCAL_EXTRACAO_PROMPT = `Você é um assistente especializado em leitura de notas fiscais brasileiras (NF-e, NFC-e, cupom fiscal) para obras de construção civil.

Analise o documento enviado (imagem ou PDF) e retorne APENAS um JSON válido, sem markdown:

{
  "fornecedor": "",
  "cnpj": "",
  "data_nota": "YYYY-MM-DD",
  "valor_total": 0,
  "itens": [
    {
      "descricao": "",
      "quantidade": 1,
      "unidade": "",
      "valor_unitario": 0,
      "valor_total": 0
    }
  ]
}

REGRAS:
- Retorne SOMENTE JSON válido.
- Use números decimais com ponto, sem símbolo de moeda.
- Converta datas dd/mm/aaaa para YYYY-MM-DD.
- Inclua TODOS os produtos/serviços identificados individualmente (nunca agrupe a nota inteira).
- Extraia descrição, quantidade, unidade e valores de cada item.
- NÃO classifique categoria ou etapa — o sistema fará isso automaticamente.`;

/** @deprecated Use NOTA_FISCAL_EXTRACAO_PROMPT */
export const NOTA_FISCAL_IA_PROMPT = NOTA_FISCAL_EXTRACAO_PROMPT;

export type NotaFiscalItemExtraido = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
  categoria: string;
  etapa: string;
  confianca_categoria: number;
  confianca_etapa: number;
  necessita_revisao: boolean;
  revisado_pelo_usuario: boolean;
  fonte_classificacao?: FonteClassificacao;
  mensagem_revisao?: string;
};

export type NotaFiscalLeitura = {
  fornecedor: string;
  cnpj: string;
  data: string;
  valor_total: number;
  itens: NotaFiscalItemExtraido[];
};

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value
      .replace(/R\$\s?/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const text = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

export function normalizeCnpj(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value.trim();
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function createItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseItemBasico(item: unknown): NotaFiscalItemExtraido {
  const registro = (item ?? {}) as Record<string, unknown>;
  const quantidade = parseNumber(registro.quantidade) || 1;
  const valorUnitario = parseNumber(registro.valor_unitario);
  const valorTotal =
    parseNumber(registro.valor_total) || quantidade * valorUnitario;

  const descricao = String(
    registro.descricao ?? registro.produto ?? ""
  ).trim();

  return {
    id: createItemId(),
    descricao,
    quantidade,
    unidade: String(registro.unidade ?? "").trim(),
    valor_unitario:
      valorUnitario || (quantidade > 0 ? valorTotal / quantidade : 0),
    valor_total: valorTotal,
    categoria: "Outros",
    etapa: "Não classificado",
    confianca_categoria: 0,
    confianca_etapa: 0,
    necessita_revisao: true,
    revisado_pelo_usuario: false,
  };
}

function aplicarClassificacaoNoItem(
  item: NotaFiscalItemExtraido,
  contexto?: ContextoClassificacao,
  sugestaoIA?: {
    categoria?: unknown;
    etapa?: unknown;
    confianca_categoria?: unknown;
    confianca_etapa?: unknown;
  }
): NotaFiscalItemExtraido {
  const classificacao = enriquecerClassificacaoItem(
    item.descricao,
    sugestaoIA?.categoria,
    sugestaoIA?.etapa,
    sugestaoIA?.confianca_categoria,
    sugestaoIA?.confianca_etapa,
    contexto
  );

  const unidade =
    item.unidade.trim() ||
    classificacao.unidade?.trim() ||
    item.unidade;

  return {
    ...item,
    unidade,
    categoria: classificacao.categoria,
    etapa: classificacao.etapa,
    confianca_categoria: classificacao.confianca_categoria,
    confianca_etapa: classificacao.confianca_etapa,
    necessita_revisao: classificacao.necessita_revisao,
    fonte_classificacao: classificacao.fonte,
    mensagem_revisao: classificacao.mensagem_revisao,
  };
}

export function parseNotaFiscalLeitura(
  raw: unknown,
  contexto?: ContextoClassificacao
): NotaFiscalLeitura {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta da IA em formato inválido.");
  }

  const data = raw as Record<string, unknown>;
  const itensRaw = Array.isArray(data.itens) ? data.itens : data.produtos;

  const itensBase: NotaFiscalItemExtraido[] = Array.isArray(itensRaw)
    ? itensRaw.map((item) => parseItemBasico(item))
    : [];

  const itens = itensBase.map((item) =>
    aplicarClassificacaoNoItem(item, contexto)
  );

  return {
    fornecedor: String(data.fornecedor ?? "").trim(),
    cnpj: normalizeCnpj(data.cnpj),
    data: normalizeDate(data.data_nota ?? data.data),
    valor_total: parseNumber(data.valor_total),
    itens,
  };
}

/** Classifica itens desconhecidos via OpenAI (somente quando necessário). */
export async function enriquecerLeituraComClassificacaoIA(
  leitura: NotaFiscalLeitura,
  contexto?: ContextoClassificacao
): Promise<NotaFiscalLeitura> {
  const indicesDesconhecidos: number[] = [];
  const descricoesDesconhecidas: string[] = [];

  leitura.itens.forEach((item, index) => {
    if (!item.descricao.trim()) return;
    if (
      item.fonte_classificacao === "catalogo" ||
      item.fonte_classificacao === "aprendida"
    ) {
      return;
    }
    if (!item.necessita_revisao) return;
    if (!precisaClassificacaoIA(item.descricao, contexto)) return;

    indicesDesconhecidos.push(index);
    descricoesDesconhecidas.push(item.descricao);
  });

  if (descricoesDesconhecidas.length === 0) {
    return leitura;
  }

  const sugestoes = await classificarItensDesconhecidosComOpenAI(
    descricoesDesconhecidas
  );

  const itensAtualizados = leitura.itens.map((item, index) => {
    const posicao = indicesDesconhecidos.indexOf(index);
    if (posicao === -1) return item;

    const sugestao = sugestoes.get(posicao);
    if (!sugestao) return item;

    return aplicarClassificacaoNoItem(item, contexto, sugestao);
  });

  return { ...leitura, itens: itensAtualizados };
}

export function syncItemTotal(
  item: NotaFiscalItemExtraido,
  field: keyof NotaFiscalItemExtraido,
  value: string | number | boolean
): NotaFiscalItemExtraido {
  const updated = { ...item, [field]: value };

  if (field === "quantidade" || field === "valor_unitario") {
    updated.valor_total = updated.quantidade * updated.valor_unitario;
  }

  if (field === "valor_total") {
    updated.valor_unitario =
      updated.quantidade > 0 ? updated.valor_total / updated.quantidade : 0;
  }

  if (field === "categoria" || field === "etapa") {
    updated.revisado_pelo_usuario = true;
    updated.necessita_revisao = false;
    updated.mensagem_revisao = undefined;
    updated.confianca_categoria = 1;
    updated.confianca_etapa = 1;
  }

  return updated;
}

export function formatDescricaoComUnidade(item: NotaFiscalItemExtraido): string {
  const descricao = item.descricao.trim();
  const unidade = item.unidade.trim();

  if (!descricao) {
    return "";
  }

  if (!unidade) {
    return descricao;
  }

  return `${descricao} (${unidade})`;
}

/** @deprecated Use formatDescricaoComUnidade */
export function formatProdutoComUnidade(item: NotaFiscalItemExtraido): string {
  return formatDescricaoComUnidade(item);
}

export function montarObservacoesNota(
  cnpj: string,
  observacoes: string
): string | null {
  const partes: string[] = [];

  if (cnpj.trim()) {
    partes.push(`CNPJ: ${cnpj.trim()}`);
  }

  if (observacoes.trim()) {
    partes.push(observacoes.trim());
  }

  return partes.length > 0 ? partes.join("\n") : null;
}

export function criarItemVazio(): NotaFiscalItemExtraido {
  return {
    id: createItemId(),
    descricao: "",
    quantidade: 1,
    unidade: "UN",
    valor_unitario: 0,
    valor_total: 0,
    categoria: "Material",
    etapa: "Não classificado",
    confianca_categoria: 1,
    confianca_etapa: 1,
    necessita_revisao: false,
    revisado_pelo_usuario: true,
  };
}
