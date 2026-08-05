export type IndicadorAssistente = {
  tipo: "alerta" | "info" | "sucesso" | "atencao";
  titulo: string;
  mensagem: string;
};

export type GraficoAssistente = {
  tipo: "bar" | "pie";
  titulo: string;
  dados: Array<{ label: string; valor: number; percentual?: number }>;
};

export type FonteRespostaAssistente = "dados" | "ia" | "misto";

export type RespostaEngenheiroCedro = {
  texto: string;
  indicadores: IndicadorAssistente[];
  graficos: GraficoAssistente[];
  fonte: FonteRespostaAssistente;
  intent: string;
};

export type MensagemAssistente = {
  id: string;
  role: "user" | "assistant";
  conteudo: string;
  metadados?: {
    indicadores?: IndicadorAssistente[];
    graficos?: GraficoAssistente[];
    intent?: string;
    fonte?: FonteRespostaAssistente;
  };
  intent?: string | null;
  fonte?: string | null;
  criado_em: string;
};

export type ConversaAssistente = {
  id: string;
  titulo: string | null;
  obra_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type ObraResumo = {
  id: string;
  nome: string;
  status: string;
  cliente_nome: string;
  orcamento_previsto: number;
  valor_recebido: number;
  gasto_realizado: number;
  lucro_estimado: number;
  data_inicio: string | null;
  data_previsao_termino: string | null;
};

export type GastoRegistro = {
  id: string;
  obra_id: string;
  obra_nome: string;
  etapa: string;
  categoria: string;
  descricao: string;
  fornecedor: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_gasto: string | null;
};

export type NotaFiscalResumo = {
  id: string;
  obra_id: string;
  obra_nome: string;
  fornecedor: string | null;
  data_nota: string | null;
  valor_total: number;
  status_processamento: string;
};

export type ClassificacaoAprendidaResumo = {
  termo_chave: string;
  categoria: string;
  etapa: string;
  uso_count: number;
};

export type SnapshotEngenheiroCedro = {
  obras: ObraResumo[];
  gastos: GastoRegistro[];
  notas: NotaFiscalResumo[];
  classificacoesAprendidas: ClassificacaoAprendidaResumo[];
  totais: {
    gastoGeral: number;
    recebidoGeral: number;
    lucroGeral: number;
    orcamentoGeral: number;
  };
};

export type IntentEngenheiroCedro =
  | "gasto_total_obra"
  | "gasto_etapa"
  | "fornecedor_top"
  | "orcamento_restante"
  | "categorias_acima"
  | "obra_maior_lucro"
  | "compras_suspeitas"
  | "comparar_obras"
  | "etapa_mais_cara"
  | "economizar"
  | "notas_duplicadas"
  | "orcamento_suficiente"
  | "lucratividade"
  | "fornecedores_vendas"
  | "risco_prejuizo"
  | "resumo_financeiro"
  | "analise_ia";

export const SUGESTOES_ENGENHEIRO_CEDRO = [
  "Como está minha lucratividade?",
  "Quanto já gastei em fundação?",
  "Quais fornecedores mais vendem?",
  "Existe risco de prejuízo?",
  "Qual obra é mais lucrativa?",
  "Quanto falta para terminar o orçamento?",
  "Qual etapa está consumindo mais dinheiro?",
  "Existe alguma nota duplicada?",
  "Onde posso economizar?",
  "Compare as obras em andamento.",
] as const;
