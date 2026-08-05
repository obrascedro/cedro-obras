export type AcompanhamentoResumo = {
  id: string;
  obra_id: string;
  obra_nome: string;
  funcionario_id: string;
  funcionario_nome: string;
  etapa: string;
  etapa_codigo: string;
  etapa_outro: string | null;
  /** @deprecated use observacao_funcionario */
  observacao: string | null;
  observacao_funcionario: string | null;
  data_atualizacao: string;
  criado_em: string;
  ativo: boolean;
  total_fotos: number;
};

export type AcompanhamentoFoto = {
  id: string;
  storage_path: string;
  nome_original: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
};

export type AcompanhamentoDetalhe = AcompanhamentoResumo & {
  fotos: AcompanhamentoFoto[];
};
