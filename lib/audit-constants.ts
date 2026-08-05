export const AUDIT_MODULOS = [
  "auth",
  "funcionarios",
  "notas_fiscais",
  "financeiro",
  "obras",
  "clientes",
  "configuracoes",
] as const;

export type AuditModulo = (typeof AUDIT_MODULOS)[number];

export type AuditLogRow = {
  id: string;
  created_at: string;
  usuario_id: string | null;
  usuario_nome: string;
  usuario_email: string | null;
  usuario_role: string | null;
  modulo: string;
  acao: string;
  descricao: string;
  tabela: string | null;
  registro_id: string | null;
  ip: string | null;
  user_agent: string | null;
};
