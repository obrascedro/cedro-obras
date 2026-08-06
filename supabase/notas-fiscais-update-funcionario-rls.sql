-- =============================================================================
-- Cedro Obras — Corrigir UPDATE em notas_fiscais para funcionário (portal)
-- Idempotente · execute no SQL Editor do Supabase
--
-- Problema: após INSERT pelo portal, o app muda status para 'processando' e
-- depois 'pendente_aprovacao' usando a sessão do funcionário (não service role).
-- A policy notas_fiscais_update antiga permitia UPDATE somente para admin.
--
-- Pré-requisitos: auth_user_id em notas_fiscais, is_admin_ativo(),
-- is_funcionario_ativo(), meu_funcionario_id() (portal-minhas-notas-rls.sql)
-- =============================================================================

-- 1. DIAGNÓSTICO — policies atuais (executar e revisar o resultado)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notas_fiscais'
ORDER BY policyname, cmd;

-- 2. DIAGNÓSTICO — colunas de ownership usadas pelo app
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notas_fiscais'
  AND column_name IN (
    'auth_user_id',
    'funcionario_id',
    'enviado_por',
    'origem',
    'status_processamento'
  )
ORDER BY column_name;

-- 3. CORREÇÃO — UPDATE: admin OU dono da nota (auth_user_id = auth.uid())
DROP POLICY IF EXISTS "notas_fiscais_update" ON public.notas_fiscais;

CREATE POLICY "notas_fiscais_update"
  ON public.notas_fiscais FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR (
      public.is_funcionario_ativo()
      AND auth_user_id = auth.uid()
      AND origem = 'portal_funcionario'
    )
  )
  WITH CHECK (
    public.is_admin_ativo()
    OR (
      public.is_funcionario_ativo()
      AND auth_user_id = auth.uid()
      AND origem = 'portal_funcionario'
      AND funcionario_id = public.meu_funcionario_id()
    )
  );

-- 4. VERIFICAÇÃO — policy aplicada
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notas_fiscais'
  AND policyname = 'notas_fiscais_update';
