-- Cedro Obras — Auditoria (Log de Atividades) — não destrutivo
-- Execute no SQL Editor do Supabase

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome text NOT NULL DEFAULT 'Sistema',
  usuario_email text,
  usuario_role text,
  modulo text NOT NULL,
  acao text NOT NULL,
  descricao text NOT NULL,
  tabela text,
  registro_id uuid,
  ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_usuario_id_idx
  ON public.audit_logs (usuario_id);

CREATE INDEX IF NOT EXISTS audit_logs_modulo_idx
  ON public.audit_logs (modulo);

CREATE INDEX IF NOT EXISTS audit_logs_acao_idx
  ON public.audit_logs (acao);

CREATE INDEX IF NOT EXISTS audit_logs_registro_id_idx
  ON public.audit_logs (registro_id);

CREATE INDEX IF NOT EXISTS audit_logs_descricao_trgm_idx
  ON public.audit_logs USING gin (descricao gin_trgm_ops);

-- 2. RLS — somente admin lê; ninguém edita/exclui via API
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

-- Inserções via service role no servidor (registrarAuditoria) e triggers SECURITY DEFINER.

-- 3. Função auxiliar para triggers
CREATE OR REPLACE FUNCTION public.audit_log_admin_context(
  OUT uid uuid,
  OUT nome text,
  OUT email text,
  OUT role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN;
  END IF;

  SELECT p.nome, p.email, p.role
  INTO nome, email, role
  FROM public.profiles p
  WHERE p.id = uid AND p.role = 'admin' AND p.ativo = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_log_from_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_nome text;
  v_email text;
  v_role text;
  v_modulo text;
  v_acao text;
  v_descricao text;
  v_registro_id uuid;
  v_rotulo text;
BEGIN
  SELECT uid, nome, email, role
  INTO v_uid, v_nome, v_email, v_role
  FROM public.audit_log_admin_context();

  IF v_nome IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_registro_id := COALESCE(NEW.id, OLD.id);

  CASE TG_TABLE_NAME
    WHEN 'obras' THEN
      v_modulo := 'obras';
      v_rotulo := COALESCE(NEW.nome, OLD.nome, 'obra');
    WHEN 'clientes' THEN
      v_modulo := 'clientes';
      v_rotulo := COALESCE(NEW.nome, OLD.nome, 'cliente');
    ELSE
      RETURN COALESCE(NEW, OLD);
  END CASE;

  IF TG_OP = 'INSERT' THEN
    v_acao := 'criacao';
    v_descricao := v_nome || ' criou ' ||
      CASE TG_TABLE_NAME WHEN 'obras' THEN 'a obra ' ELSE 'o cliente ' END ||
      v_rotulo;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'edicao';
    v_descricao := v_nome || ' editou ' ||
      CASE TG_TABLE_NAME WHEN 'obras' THEN 'a obra ' ELSE 'o cliente ' END ||
      v_rotulo;
  ELSIF TG_OP = 'DELETE' THEN
    v_acao := 'exclusao';
    v_descricao := v_nome || ' excluiu ' ||
      CASE TG_TABLE_NAME WHEN 'obras' THEN 'a obra ' ELSE 'o cliente ' END ||
      v_rotulo;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.audit_logs (
    usuario_id, usuario_nome, usuario_email, usuario_role,
    modulo, acao, descricao, tabela, registro_id
  ) VALUES (
    v_uid, v_nome, v_email, v_role,
    v_modulo, v_acao, v_descricao, TG_TABLE_NAME, v_registro_id
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Gastos: INSERT unitário (formulário manual). Bulk (aprovação/importação) não gera log aqui.
CREATE OR REPLACE FUNCTION public.audit_gastos_obra_insert_stmt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_nome text;
  v_email text;
  v_role text;
  v_count bigint;
  v_registro_id uuid;
  v_descricao_gasto text;
BEGIN
  SELECT uid, nome, email, role
  INTO v_uid, v_nome, v_email, v_role
  FROM public.audit_log_admin_context();

  IF v_nome IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT count(*), min(id), min(descricao)
  INTO v_count, v_registro_id, v_descricao_gasto
  FROM inserted_rows;

  IF v_count <> 1 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.audit_logs (
    usuario_id, usuario_nome, usuario_email, usuario_role,
    modulo, acao, descricao, tabela, registro_id
  ) VALUES (
    v_uid, v_nome, v_email, v_role,
    'financeiro', 'criacao',
    v_nome || ' criou o gasto ' || COALESCE(v_descricao_gasto, 'financeiro'),
    'gastos_obra', v_registro_id
  );

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_gastos_obra_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_nome text;
  v_email text;
  v_role text;
  v_acao text;
  v_descricao text;
  v_registro_id uuid;
  v_rotulo text;
BEGIN
  SELECT uid, nome, email, role
  INTO v_uid, v_nome, v_email, v_role
  FROM public.audit_log_admin_context();

  IF v_nome IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_registro_id := COALESCE(NEW.id, OLD.id);
  v_rotulo := COALESCE(NEW.descricao, OLD.descricao, 'gasto');

  IF TG_OP = 'UPDATE' THEN
    v_acao := 'edicao';
    v_descricao := v_nome || ' editou o gasto ' || v_rotulo;
  ELSIF TG_OP = 'DELETE' THEN
    v_acao := 'exclusao';
    v_descricao := v_nome || ' excluiu o gasto ' || v_rotulo;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.audit_logs (
    usuario_id, usuario_nome, usuario_email, usuario_role,
    modulo, acao, descricao, tabela, registro_id
  ) VALUES (
    v_uid, v_nome, v_email, v_role,
    'financeiro', v_acao, v_descricao, 'gastos_obra', v_registro_id
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_obras_changes ON public.obras;
CREATE TRIGGER audit_obras_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_from_trigger();

DROP TRIGGER IF EXISTS audit_clientes_changes ON public.clientes;
CREATE TRIGGER audit_clientes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_from_trigger();

DROP TRIGGER IF EXISTS audit_gastos_obra_insert ON public.gastos_obra;
CREATE TRIGGER audit_gastos_obra_insert
  AFTER INSERT ON public.gastos_obra
  REFERENCING NEW TABLE AS inserted_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.audit_gastos_obra_insert_stmt();

DROP TRIGGER IF EXISTS audit_gastos_obra_row ON public.gastos_obra;
CREATE TRIGGER audit_gastos_obra_row
  AFTER UPDATE OR DELETE ON public.gastos_obra
  FOR EACH ROW EXECUTE FUNCTION public.audit_gastos_obra_row();
