-- DEPRECATED: use supabase/unified-auth.sql (canônico). Não execute em ambientes novos.
-- Cedro Obras — perfis de usuário com role admin (Supabase Auth)
-- Execute no SQL Editor do Supabase

-- 1. Tabela de perfis vinculada ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- 2. Trigger: cria perfil ao registrar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. RLS — usuário autenticado lê apenas o próprio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Perfis para usuários já existentes no Auth (se houver)
INSERT INTO public.profiles (id, email, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_app_meta_data->>'role', 'user')
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

-- 5. Promover administrador (ajuste o e-mail após criar o usuário no Auth)
-- Dashboard Supabase → Authentication → Users → Add user
-- E-mail sugerido: admin@cedroobras.com.br
-- Senha sugerida: Cedro2026#
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@cedroobras.com.br';
