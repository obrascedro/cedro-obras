-- =============================================================================
-- Cedro Obras — Engenheiro Cedro: assistente_conversas + assistente_mensagens
-- Idempotente · execute no SQL Editor do Supabase
--
-- Pré-requisitos: public.obras, public.profiles (unified-auth.sql)
-- Recomendado antes: admin-funcionarios.sql (função is_admin_ativo)
-- Se já rodou production-rls-hardening.sql, este script é seguro reexecutar.
-- =============================================================================

-- Função auxiliar (noop se já existir)
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

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistente_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text,
  obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assistente_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.assistente_conversas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo text NOT NULL,
  metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent text,
  fonte text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Migração de instalações anteriores (sem usuario_id)
ALTER TABLE public.assistente_conversas
  ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.assistente_conversas
  ADD COLUMN IF NOT EXISTS titulo text;

ALTER TABLE public.assistente_conversas
  ADD COLUMN IF NOT EXISTS obra_id uuid;

ALTER TABLE public.assistente_conversas
  ADD COLUMN IF NOT EXISTS criado_em timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.assistente_conversas
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assistente_conversas_obra_id_fkey'
  ) THEN
    ALTER TABLE public.assistente_conversas
      ADD CONSTRAINT assistente_conversas_obra_id_fkey
      FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assistente_conversas_atualizado
  ON public.assistente_conversas (atualizado_em DESC);

CREATE INDEX IF NOT EXISTS idx_assistente_conversas_usuario
  ON public.assistente_conversas (usuario_id, atualizado_em DESC);

CREATE INDEX IF NOT EXISTS idx_assistente_mensagens_conversa
  ON public.assistente_mensagens (conversa_id, criado_em ASC);

-- ---------------------------------------------------------------------------
-- RLS — admin ativo + ownership por usuario_id (compatível com o código)
-- ---------------------------------------------------------------------------
ALTER TABLE public.assistente_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistente_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assistente_conversas_select" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_insert" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_update" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_delete" ON public.assistente_conversas;

DROP POLICY IF EXISTS "assistente_mensagens_select" ON public.assistente_mensagens;
DROP POLICY IF EXISTS "assistente_mensagens_insert" ON public.assistente_mensagens;
DROP POLICY IF EXISTS "assistente_mensagens_delete" ON public.assistente_mensagens;

CREATE POLICY "assistente_conversas_select"
  ON public.assistente_conversas FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_conversas_insert"
  ON public.assistente_conversas FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_conversas_update"
  ON public.assistente_conversas FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  )
  WITH CHECK (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_conversas_delete"
  ON public.assistente_conversas FOR DELETE
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_mensagens_select"
  ON public.assistente_mensagens FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND EXISTS (
      SELECT 1
      FROM public.assistente_conversas c
      WHERE c.id = conversa_id
        AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
    )
  );

CREATE POLICY "assistente_mensagens_insert"
  ON public.assistente_mensagens FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    AND EXISTS (
      SELECT 1
      FROM public.assistente_conversas c
      WHERE c.id = conversa_id
        AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
    )
  );

CREATE POLICY "assistente_mensagens_delete"
  ON public.assistente_mensagens FOR DELETE
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND EXISTS (
      SELECT 1
      FROM public.assistente_conversas c
      WHERE c.id = conversa_id
        AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
    )
  );

-- ---------------------------------------------------------------------------
-- Verificação
-- ---------------------------------------------------------------------------
SELECT
  'assistente_conversas' AS tabela,
  count(*) AS colunas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'assistente_conversas';

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('assistente_conversas', 'assistente_mensagens')
ORDER BY tablename, policyname;
