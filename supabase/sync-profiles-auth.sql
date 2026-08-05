-- =============================================================================
-- Cedro Obras — Sincronização auth.users ↔ public.profiles ↔ portal_funcionarios
-- Execute este arquivo INTEIRO no SQL Editor do Supabase (uma vez).
--
-- O que faz:
--   1. Garante tabela portal_funcionarios + cadastros Edson / Isaque
--   2. Cria/atualiza public.profiles (schema canônico)
--   3. Trigger: todo usuário NOVO no Auth ganha profile automaticamente
--   4. Sincroniza TODOS os auth.users já existentes → profiles
--   5. Define roles: edson@cedroobras.com = admin, isaquecabral@... = funcionario
--   6. Vincula funcionario_id em portal_funcionarios
--
-- NÃO cria usuários no Auth. NÃO altera senhas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. portal_funcionarios (pré-requisito da FK funcionario_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_funcionarios_nome_unique UNIQUE (nome)
);

CREATE INDEX IF NOT EXISTS portal_funcionarios_ativo_idx
  ON public.portal_funcionarios (ativo)
  WHERE ativo = true;

INSERT INTO public.portal_funcionarios (nome, ativo)
VALUES
  ('Isaque Cabral', true),
  ('Edson Junior', true)
ON CONFLICT (nome) DO UPDATE SET ativo = EXCLUDED.ativo;

-- ---------------------------------------------------------------------------
-- B. public.profiles — criar ou migrar schema legado
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT 'Usuário',
  role text NOT NULL DEFAULT 'funcionario',
  funcionario_id uuid REFERENCES public.portal_funcionarios(id),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS funcionario_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS criado_em timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- FK funcionario_id (se coluna existia sem FK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_funcionario_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_funcionario_id_fkey
      FOREIGN KEY (funcionario_id) REFERENCES public.portal_funcionarios(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Migrar nome a partir de coluna email legada (admin-auth.sql antigo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    UPDATE public.profiles
    SET nome = COALESCE(NULLIF(trim(nome), ''), email, 'Usuário')
    WHERE nome IS NULL OR trim(nome) = '';
  END IF;
END $$;

UPDATE public.profiles SET nome = COALESCE(NULLIF(trim(nome), ''), 'Usuário') WHERE nome IS NULL;
ALTER TABLE public.profiles ALTER COLUMN nome SET NOT NULL;

-- Normalizar roles inválidas
UPDATE public.profiles
SET role = 'funcionario'
WHERE role IS NULL OR role NOT IN ('admin', 'funcionario', 'diretoria');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'funcionario', 'diretoria'));

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_funcionario_id_idx ON public.profiles (funcionario_id);
CREATE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- C. Trigger — profile automático para usuários NOVOS no Auth
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfil_nome text;
BEGIN
  perfil_nome := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1),
    'Usuário'
  );

  INSERT INTO public.profiles (id, nome, role, ativo, email)
  VALUES (
    NEW.id,
    perfil_nome,
    'funcionario',
    true,
    lower(trim(NEW.email))
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = COALESCE(NULLIF(trim(EXCLUDED.nome), ''), public.profiles.nome),
    email = COALESCE(EXCLUDED.email, public.profiles.email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- D. RLS mínima — usuário autenticado lê o próprio perfil
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- E. Sincronizar TODOS os auth.users existentes → profiles
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, nome, role, ativo, email)
SELECT
  u.id,
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data->>'nome'), ''),
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(u.email, '@', 1),
    'Usuário'
  ),
  'funcionario',
  true,
  lower(trim(u.email))
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  nome = COALESCE(NULLIF(trim(EXCLUDED.nome), ''), public.profiles.nome),
  email = COALESCE(EXCLUDED.email, public.profiles.email),
  ativo = true;

-- ---------------------------------------------------------------------------
-- F. Roles específicas — Edson (admin) e Isaque (funcionario)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  edson_id uuid;
  isaque_id uuid;
BEGIN
  SELECT id INTO edson_id
  FROM auth.users
  WHERE lower(trim(email)) = 'edson@cedroobras.com';

  SELECT id INTO isaque_id
  FROM auth.users
  WHERE lower(trim(email)) = 'isaquecabral@cedroobras.com';

  IF edson_id IS NULL THEN
    RAISE EXCEPTION 'Auth: usuário não encontrado → edson@cedroobras.com';
  END IF;

  IF isaque_id IS NULL THEN
    RAISE EXCEPTION 'Auth: usuário não encontrado → isaquecabral@cedroobras.com';
  END IF;

  UPDATE public.profiles
  SET nome = 'Edson Junior', role = 'admin', ativo = true, funcionario_id = NULL, email = 'edson@cedroobras.com'
  WHERE id = edson_id;

  UPDATE public.profiles
  SET nome = 'Isaque Cabral', role = 'funcionario', ativo = true, email = 'isaquecabral@cedroobras.com'
  WHERE id = isaque_id;

  RAISE NOTICE 'Perfis configurados — Edson: %, Isaque: %', edson_id, isaque_id;
END $$;

-- ---------------------------------------------------------------------------
-- G. Vincular portal_funcionarios pelo e-mail / nome
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET funcionario_id = pf.id
FROM auth.users u,
     public.portal_funcionarios pf
WHERE p.id = u.id
  AND lower(trim(u.email)) = 'isaquecabral@cedroobras.com'
  AND pf.nome = 'Isaque Cabral'
  AND pf.ativo = true;

-- Edson admin: sem funcionario_id (opcional manter vínculo nulo)
UPDATE public.profiles p
SET funcionario_id = NULL
FROM auth.users u
WHERE p.id = u.id
  AND lower(trim(u.email)) = 'edson@cedroobras.com';

-- Demais funcionários: match automático por nome
UPDATE public.profiles p
SET funcionario_id = pf.id
FROM public.portal_funcionarios pf
WHERE p.role = 'funcionario'
  AND p.funcionario_id IS NULL
  AND lower(trim(p.nome)) = lower(trim(pf.nome))
  AND pf.ativo = true;

-- ---------------------------------------------------------------------------
-- H. Verificação final
-- ---------------------------------------------------------------------------
SELECT
  u.email,
  p.nome,
  p.role,
  p.ativo,
  p.funcionario_id,
  pf.nome AS portal_funcionario,
  p.criado_em
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.portal_funcionarios pf ON pf.id = p.funcionario_id
WHERE lower(trim(u.email)) IN ('edson@cedroobras.com', 'isaquecabral@cedroobras.com')
ORDER BY p.role DESC, p.nome;

-- Contagem geral (deve bater com auth.users)
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM auth.users u WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )) AS auth_sem_profile;
