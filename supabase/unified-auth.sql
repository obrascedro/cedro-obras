-- Cedro Obras — autenticação unificada (Supabase Auth + profiles)
-- Execute no SQL Editor do Supabase

-- 1. Tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  role text NOT NULL DEFAULT 'funcionario' CHECK (role IN ('admin', 'funcionario', 'diretoria')),
  funcionario_id uuid REFERENCES public.portal_funcionarios(id),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Migrar tabela existente (instalações anteriores)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS funcionario_id uuid REFERENCES public.portal_funcionarios(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    UPDATE public.profiles SET nome = COALESCE(nome, email, 'Usuário') WHERE nome IS NULL;
  ELSE
    UPDATE public.profiles SET nome = COALESCE(nome, 'Usuário') WHERE nome IS NULL;
  END IF;
END $$;

ALTER TABLE public.profiles ALTER COLUMN nome SET NOT NULL;

UPDATE public.profiles SET role = 'funcionario' WHERE role NOT IN ('admin', 'funcionario', 'diretoria');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'funcionario', 'diretoria'));

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_funcionario_id_idx ON public.profiles (funcionario_id);

-- 2. Trigger: cria perfil ao registrar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfil_nome text;
  perfil_role text;
BEGIN
  perfil_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  -- Sempre funcionário no signup público; admin/diretoria só via service role (A-05).
  perfil_role := 'funcionario';

  INSERT INTO public.profiles (id, nome, role, ativo)
  VALUES (NEW.id, perfil_nome, perfil_role, true)
  ON CONFLICT (id) DO UPDATE
    SET nome = EXCLUDED.nome;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Sincronizar perfis para usuários Auth já existentes
INSERT INTO public.profiles (id, nome, role, ativo)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'nome', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE
    WHEN COALESCE(u.raw_app_meta_data->>'role', 'funcionario') = 'admin' THEN 'admin'
    ELSE 'funcionario'
  END,
  true
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET nome = EXCLUDED.nome;

-- 5. Vincular funcionários pelo nome (Isaque Cabral, Edson Junior, etc.)
UPDATE public.profiles p
SET funcionario_id = pf.id
FROM public.portal_funcionarios pf
WHERE p.role = 'funcionario'
  AND p.funcionario_id IS NULL
  AND lower(trim(p.nome)) = lower(trim(pf.nome))
  AND pf.ativo = true;

-- 6. Promover administradores (ajuste os e-mails após criar no Auth)
-- Supabase → Authentication → Users → Add user
-- Depois execute os UPDATEs abaixo com os e-mails reais:

-- UPDATE public.profiles SET role = 'admin', nome = 'Edson Junior', ativo = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_EDSON@...');

-- UPDATE public.profiles SET role = 'funcionario', nome = 'Isaque Cabral', ativo = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_ISAQUE@...');

-- UPDATE public.profiles p SET funcionario_id = pf.id
-- FROM public.portal_funcionarios pf
-- WHERE p.nome = 'Isaque Cabral' AND pf.nome = 'Isaque Cabral';
