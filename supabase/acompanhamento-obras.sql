-- =============================================================================
-- Cedro Obras — Acompanhamento de Obra
-- Idempotente · execute no SQL Editor do Supabase
-- Pré-requisito: portal-funcionarios.sql, funcionario-obras.sql
--
-- ORDEM INTERNA:
--   1. Funções auxiliares (ANTES de policies)
--   2. Tabelas + índices + triggers
--   3. RLS + policies (tabelas)
--   4. Bucket Storage + policies
--   5. Verificação final
-- =============================================================================

-- =============================================================================
-- 1. FUNÇÕES AUXILIARES
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

CREATE OR REPLACE FUNCTION public.funcionario_autorizado_obra(p_obra_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.funcionario_obras fo
    WHERE fo.funcionario_id = public.meu_funcionario_id()
      AND fo.obra_id = p_obra_id
      AND fo.ativo = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_ativo() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_funcionario_ativo() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.meu_funcionario_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.funcionario_autorizado_obra(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_funcionario_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_funcionario_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.funcionario_autorizado_obra(uuid) TO authenticated;

-- =============================================================================
-- 2. TABELAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.acompanhamento_obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE RESTRICT,
  funcionario_id uuid NOT NULL REFERENCES public.portal_funcionarios(id) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  etapa text NOT NULL,
  etapa_outro text NULL,
  observacao text NOT NULL,
  data_atualizacao date NOT NULL DEFAULT CURRENT_DATE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.acompanhamento_obras_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acompanhamento_id uuid NOT NULL
    REFERENCES public.acompanhamento_obras(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  nome_original text NULL,
  mime_type text NULL,
  tamanho_bytes bigint NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.acompanhamento_obras
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.acompanhamento_obras
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.acompanhamento_obras
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS acompanhamento_obras_obra_id_idx
  ON public.acompanhamento_obras (obra_id);

CREATE INDEX IF NOT EXISTS acompanhamento_obras_funcionario_id_idx
  ON public.acompanhamento_obras (funcionario_id);

CREATE INDEX IF NOT EXISTS acompanhamento_obras_auth_user_id_idx
  ON public.acompanhamento_obras (auth_user_id);

CREATE INDEX IF NOT EXISTS acompanhamento_obras_data_atualizacao_idx
  ON public.acompanhamento_obras (data_atualizacao DESC);

CREATE INDEX IF NOT EXISTS acompanhamento_obras_criado_em_idx
  ON public.acompanhamento_obras (criado_em DESC);

CREATE INDEX IF NOT EXISTS acompanhamento_obras_ativo_idx
  ON public.acompanhamento_obras (ativo)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS acompanhamento_obras_fotos_acompanhamento_id_idx
  ON public.acompanhamento_obras_fotos (acompanhamento_id);

CREATE UNIQUE INDEX IF NOT EXISTS acompanhamento_obras_fotos_storage_path_unique
  ON public.acompanhamento_obras_fotos (storage_path);

CREATE OR REPLACE FUNCTION public.set_acompanhamento_obras_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS acompanhamento_obras_atualizado_em ON public.acompanhamento_obras;

CREATE TRIGGER acompanhamento_obras_atualizado_em
  BEFORE UPDATE ON public.acompanhamento_obras
  FOR EACH ROW
  EXECUTE FUNCTION public.set_acompanhamento_obras_atualizado_em();

-- =============================================================================
-- 3. RLS — acompanhamento_obras
-- =============================================================================

ALTER TABLE public.acompanhamento_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acompanhamento_obras_select" ON public.acompanhamento_obras;
DROP POLICY IF EXISTS "acompanhamento_obras_insert" ON public.acompanhamento_obras;
DROP POLICY IF EXISTS "acompanhamento_obras_update" ON public.acompanhamento_obras;
DROP POLICY IF EXISTS "acompanhamento_obras_delete" ON public.acompanhamento_obras;

CREATE POLICY "acompanhamento_obras_select"
  ON public.acompanhamento_obras FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR (
      auth_user_id = auth.uid()
      AND ativo = true
    )
  );

CREATE POLICY "acompanhamento_obras_insert"
  ON public.acompanhamento_obras FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    OR (
      auth_user_id = auth.uid()
      AND funcionario_id = public.meu_funcionario_id()
      AND public.funcionario_autorizado_obra(obra_id)
    )
  );

CREATE POLICY "acompanhamento_obras_update"
  ON public.acompanhamento_obras FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "acompanhamento_obras_delete"
  ON public.acompanhamento_obras FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- =============================================================================
-- 4. RLS — acompanhamento_obras_fotos
-- =============================================================================

ALTER TABLE public.acompanhamento_obras_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acompanhamento_obras_fotos_select" ON public.acompanhamento_obras_fotos;
DROP POLICY IF EXISTS "acompanhamento_obras_fotos_insert" ON public.acompanhamento_obras_fotos;
DROP POLICY IF EXISTS "acompanhamento_obras_fotos_delete" ON public.acompanhamento_obras_fotos;

CREATE POLICY "acompanhamento_obras_fotos_select"
  ON public.acompanhamento_obras_fotos FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR EXISTS (
      SELECT 1
      FROM public.acompanhamento_obras ao
      WHERE ao.id = acompanhamento_obras_fotos.acompanhamento_id
        AND ao.auth_user_id = auth.uid()
        AND ao.ativo = true
    )
  );

CREATE POLICY "acompanhamento_obras_fotos_insert"
  ON public.acompanhamento_obras_fotos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    OR EXISTS (
      SELECT 1
      FROM public.acompanhamento_obras ao
      WHERE ao.id = acompanhamento_obras_fotos.acompanhamento_id
        AND ao.auth_user_id = auth.uid()
        AND ao.funcionario_id = public.meu_funcionario_id()
    )
  );

CREATE POLICY "acompanhamento_obras_fotos_delete"
  ON public.acompanhamento_obras_fotos FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- =============================================================================
-- 5. STORAGE — bucket privado acompanhamento-obras
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('acompanhamento-obras', 'acompanhamento-obras', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "acompanhamento_obras_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "acompanhamento_obras_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "acompanhamento_obras_storage_delete" ON storage.objects;

CREATE POLICY "acompanhamento_obras_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'acompanhamento-obras'
    AND (
      public.is_admin_ativo()
      OR EXISTS (
        SELECT 1
        FROM public.acompanhamento_obras_fotos f
        JOIN public.acompanhamento_obras ao ON ao.id = f.acompanhamento_id
        WHERE f.storage_path = name
          AND ao.auth_user_id = auth.uid()
          AND ao.ativo = true
      )
    )
  );

CREATE POLICY "acompanhamento_obras_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'acompanhamento-obras'
    AND (public.is_admin_ativo() OR public.is_funcionario_ativo())
  );

CREATE POLICY "acompanhamento_obras_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'acompanhamento-obras'
    AND public.is_admin_ativo()
  );

-- =============================================================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================================================

SELECT p.proname AS funcao
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin_ativo',
    'is_funcionario_ativo',
    'meu_funcionario_id',
    'funcionario_autorizado_obra'
  )
ORDER BY p.proname;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('acompanhamento_obras', 'acompanhamento_obras_fotos')
ORDER BY tablename, policyname;

SELECT id, name, public FROM storage.buckets WHERE id = 'acompanhamento-obras';

SELECT count(*) AS total_atualizacoes FROM public.acompanhamento_obras;
