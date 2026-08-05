-- Cedro Obras — Minhas Notas: auth_user_id + RLS por funcionário (não destrutivo)
-- Execute no SQL Editor do Supabase APÓS unified-auth.sql

-- 1. Coluna de vínculo com auth.users (para RLS: auth_user_id = auth.uid())
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS notas_fiscais_auth_user_id_idx
  ON public.notas_fiscais (auth_user_id);

-- 2. Backfill: notas do portal vinculadas ao perfil do funcionário
UPDATE public.notas_fiscais nf
SET auth_user_id = p.id
FROM public.profiles p
WHERE nf.auth_user_id IS NULL
  AND nf.origem = 'portal_funcionario'
  AND nf.funcionario_id IS NOT NULL
  AND p.funcionario_id = nf.funcionario_id
  AND p.role = 'funcionario';

-- 3. Função auxiliar: usuário autenticado é admin ativo
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

-- 4. Função auxiliar: funcionário ativo
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

-- 5. Função auxiliar: funcionario_id do perfil autenticado
CREATE OR REPLACE FUNCTION public.meu_funcionario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT funcionario_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'funcionario'
    AND ativo = true
  LIMIT 1;
$$;

-- 5. Substituir políticas permissivas de notas_fiscais
DROP POLICY IF EXISTS "notas_fiscais_select" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_insert" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_update" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_delete" ON public.notas_fiscais;

-- Admin: acesso total | Funcionário: somente as próprias notas
CREATE POLICY "notas_fiscais_select"
  ON public.notas_fiscais FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR auth_user_id = auth.uid()
  );

-- Funcionário: insert somente com auth_user_id próprio e funcionario_id do perfil
CREATE POLICY "notas_fiscais_insert_funcionario"
  ON public.notas_fiscais FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    OR (
      auth_user_id = auth.uid()
      AND origem = 'portal_funcionario'
      AND funcionario_id = public.meu_funcionario_id()
    )
  );

CREATE POLICY "notas_fiscais_update"
  ON public.notas_fiscais FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "notas_fiscais_delete"
  ON public.notas_fiscais FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- Funcionário: sem UPDATE nem DELETE (nenhuma policy = negado)
-- IMPORTANTE: políticas anon removidas — WhatsApp/IA usam service role no servidor.
-- Para produção completa, execute também supabase/production-rls-hardening.sql

-- 6. Storage: funcionário lê apenas arquivos das próprias notas
DROP POLICY IF EXISTS "notas_fiscais_storage_select" ON storage.objects;
CREATE POLICY "notas_fiscais_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notas-fiscais'
    AND (
      public.is_admin_ativo()
      OR EXISTS (
        SELECT 1
        FROM public.notas_fiscais nf
        WHERE nf.arquivo_path = name
          AND nf.auth_user_id = auth.uid()
      )
    )
  );

-- Storage: admin e funcionário autenticados (sem anon)
DROP POLICY IF EXISTS "notas_fiscais_storage_insert" ON storage.objects;
CREATE POLICY "notas_fiscais_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notas-fiscais'
    AND (public.is_admin_ativo() OR public.is_funcionario_ativo())
  );

DROP POLICY IF EXISTS "notas_fiscais_storage_select_anon" ON storage.objects;
DROP POLICY IF EXISTS "notas_fiscais_storage_delete" ON storage.objects;
CREATE POLICY "notas_fiscais_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notas-fiscais'
    AND public.is_admin_ativo()
  );

