-- Cedro Obras — Admin > Funcionários: email em profiles + RLS admin (não destrutivo)
-- Execute no SQL Editor do Supabase

-- 1. E-mail denormalizado para busca e listagem (sincronizado pelo servidor)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS profiles_email_lower_idx
  ON public.profiles (lower(email));

CREATE INDEX IF NOT EXISTS profiles_nome_lower_idx
  ON public.profiles (lower(nome));

-- Sincronizar e-mails existentes a partir do Auth
UPDATE public.profiles p
SET email = lower(trim(u.email))
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND (p.email IS NULL OR lower(trim(p.email)) != lower(trim(u.email)));

-- 2. Garantir função is_admin_ativo (pode já existir de portal-minhas-notas-rls.sql)
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

-- 3. RLS: admin gerencia todos os perfis; usuário lê o próprio
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo() OR auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

-- INSERT em profiles: trigger on_auth_user_created + service role no servidor admin
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_service"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo() OR auth.uid() = id);

-- 4. Admin pode gerenciar portal_funcionarios (vínculo automático ao criar funcionário)
ALTER TABLE public.portal_funcionarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_funcionarios_select" ON public.portal_funcionarios;
CREATE POLICY "portal_funcionarios_select"
  ON public.portal_funcionarios FOR SELECT
  TO anon, authenticated
  USING (ativo = true OR public.is_admin_ativo());

DROP POLICY IF EXISTS "portal_funcionarios_insert_admin" ON public.portal_funcionarios;
CREATE POLICY "portal_funcionarios_insert_admin"
  ON public.portal_funcionarios FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

DROP POLICY IF EXISTS "portal_funcionarios_update_admin" ON public.portal_funcionarios;
CREATE POLICY "portal_funcionarios_update_admin"
  ON public.portal_funcionarios FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());
