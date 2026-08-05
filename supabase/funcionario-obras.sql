-- =============================================================================
-- Cedro Obras — Gerenciamento funcionário ↔ obra (A-07) — VERSÃO CORRIGIDA
-- Referência: docs/13-sql-obrigatorios.md (#10)
--
-- SUBSTITUI os scripts antigos:
--   • supabase/funcionario-obras.sql (ordem incorreta — funções após policies)
--   • supabase/vincular-isaque-obras.sql (incorporado na seção 5)
--
-- Idempotente · seguro · não apaga dados · não recria profiles/portal_funcionarios/obras
-- Pré-requisito: portal-funcionarios.sql (ou unified-auth.sql) já executado
--
-- ORDEM INTERNA:
--   1. Funções auxiliares (ANTES de qualquer policy)
--   2. Tabela funcionario_obras + colunas + índices + trigger
--   3. RLS + policies em funcionario_obras
--   4. Policy obras_select (funcionário vê só obras vinculadas)
--   5. Vínculo Isaque Cabral → 3 obras
--   6. Verificação final
-- =============================================================================

-- =============================================================================
-- 1. FUNÇÕES AUXILIARES — devem existir ANTES das policies
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_funcionario_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'funcionario'
      AND ativo = true
  );
$$;

-- Retorna uuid do portal_funcionarios vinculado ao usuário autenticado.
-- NULL se: sem sessão, sem profile, profile inativo, role ≠ funcionario,
--          ou funcionario_id ausente.
CREATE OR REPLACE FUNCTION public.meu_funcionario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.funcionario_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.ativo = true
    AND p.role = 'funcionario'
    AND p.funcionario_id IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_admin_ativo() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_funcionario_ativo() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.meu_funcionario_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_funcionario_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_funcionario_id() TO authenticated;

-- =============================================================================
-- 2. TABELA funcionario_obras
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.funcionario_obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id uuid NOT NULL
    REFERENCES public.portal_funcionarios(id) ON DELETE CASCADE,
  obra_id uuid NOT NULL
    REFERENCES public.obras(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funcionario_obras_funcionario_obra_unique UNIQUE (funcionario_id, obra_id)
);

-- Migração: tabela antiga com PK composta (sem coluna id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'funcionario_obras'
      AND column_name = 'id'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'funcionario_obras'
  ) THEN
    ALTER TABLE public.funcionario_obras ADD COLUMN id uuid DEFAULT gen_random_uuid();
    UPDATE public.funcionario_obras SET id = gen_random_uuid() WHERE id IS NULL;
    ALTER TABLE public.funcionario_obras ALTER COLUMN id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE public.funcionario_obras
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

ALTER TABLE public.funcionario_obras
  ADD COLUMN IF NOT EXISTS criado_em timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.funcionario_obras
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS funcionario_obras_funcionario_id_idx
  ON public.funcionario_obras (funcionario_id);

CREATE INDEX IF NOT EXISTS funcionario_obras_obra_id_idx
  ON public.funcionario_obras (obra_id);

CREATE INDEX IF NOT EXISTS funcionario_obras_ativo_idx
  ON public.funcionario_obras (ativo)
  WHERE ativo = true;

CREATE OR REPLACE FUNCTION public.set_funcionario_obras_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS funcionario_obras_atualizado_em ON public.funcionario_obras;

CREATE TRIGGER funcionario_obras_atualizado_em
  BEFORE UPDATE ON public.funcionario_obras
  FOR EACH ROW
  EXECUTE FUNCTION public.set_funcionario_obras_atualizado_em();

-- =============================================================================
-- 3. RLS — funcionario_obras
-- =============================================================================

ALTER TABLE public.funcionario_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funcionario_obras_select" ON public.funcionario_obras;
DROP POLICY IF EXISTS "funcionario_obras_insert" ON public.funcionario_obras;
DROP POLICY IF EXISTS "funcionario_obras_update" ON public.funcionario_obras;
DROP POLICY IF EXISTS "funcionario_obras_delete" ON public.funcionario_obras;

CREATE POLICY "funcionario_obras_select"
  ON public.funcionario_obras FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR (
      funcionario_id = public.meu_funcionario_id()
      AND ativo = true
    )
  );

CREATE POLICY "funcionario_obras_insert"
  ON public.funcionario_obras FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "funcionario_obras_update"
  ON public.funcionario_obras FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "funcionario_obras_delete"
  ON public.funcionario_obras FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- =============================================================================
-- 4. Obras — funcionário vê somente obras vinculadas e ativas
-- =============================================================================

DROP POLICY IF EXISTS "obras_select" ON public.obras;

CREATE POLICY "obras_select"
  ON public.obras FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'diretoria' AND p.ativo = true
      )
    )
    OR (
      public.is_funcionario_ativo()
      AND public.meu_funcionario_id() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.funcionario_obras fo
        WHERE fo.obra_id = obras.id
          AND fo.funcionario_id = public.meu_funcionario_id()
          AND fo.ativo = true
      )
    )
  );

-- =============================================================================
-- 5. Vínculo Isaque Cabral → 3 obras (idempotente, só este funcionário)
-- =============================================================================

INSERT INTO public.funcionario_obras (funcionario_id, obra_id, ativo)
SELECT pf.id, o.id, true
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.portal_funcionarios pf ON pf.id = p.funcionario_id
CROSS JOIN public.obras o
WHERE lower(trim(u.email)) = 'isaquecabral@cedroobras.com'
  AND p.role = 'funcionario'
  AND p.ativo = true
  AND pf.ativo = true
  AND o.id IN (
    '62504aca-f91b-4f5d-b456-2a6b4e4ff05f',  -- J F - Quadra U 26
    'f09b2871-5a6e-42b7-8d03-383d179fc7e8',  -- Tucumã
    '302803d0-5969-4936-af81-3316578b9ca9'   -- T M - Quadra U 01
  )
  AND COALESCE(o.status, 'Em andamento') NOT IN ('Cancelada')
ON CONFLICT (funcionario_id, obra_id) DO UPDATE
  SET ativo = true;

-- =============================================================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================================================

-- 6a. Funções auxiliares existem?
SELECT
  p.proname AS funcao,
  pg_get_function_identity_arguments(p.oid) AS assinatura,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin_ativo', 'is_funcionario_ativo', 'meu_funcionario_id')
ORDER BY p.proname;

-- 6b. Tabela funcionario_obras existe?
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'funcionario_obras'
ORDER BY c.ordinal_position;

-- 6c. Policies criadas
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('funcionario_obras', 'obras')
ORDER BY tablename, policyname;

-- 6d. Total de vínculos no sistema
SELECT count(*) AS total_vinculos FROM public.funcionario_obras;

-- 6e. Vínculos do Isaque Cabral
SELECT
  pf.nome AS funcionario,
  p.email,
  o.nome AS obra,
  o.id AS obra_id,
  fo.funcionario_id,
  fo.ativo AS vinculo_ativo,
  fo.criado_em
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.portal_funcionarios pf ON pf.id = p.funcionario_id
JOIN public.funcionario_obras fo ON fo.funcionario_id = pf.id
JOIN public.obras o ON o.id = fo.obra_id
WHERE lower(trim(u.email)) = 'isaquecabral@cedroobras.com'
ORDER BY o.nome;
