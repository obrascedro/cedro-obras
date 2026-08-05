-- DEPRECATED: use supabase/sync-profiles-auth.sql (SQL único e idempotente).
-- Cedro Obras — seed de perfis: Edson Junior (admin) e Isaque Cabral (funcionario)
-- NÃO cria usuários no Auth. Apenas vincula auth.users existentes → public.profiles.
--
-- Pré-requisitos (já executados no Supabase):
--   1. supabase/unified-auth.sql
--   2. supabase/portal-funcionarios.sql
--
-- E-mails:
--   edson@cedroobras.com      → Edson Junior, role admin
--   isaquecabral@cedroobras.com → Isaque Cabral, role funcionario

-- ---------------------------------------------------------------------------
-- 0. Validar que os usuários existem no Auth (aborta se faltar algum)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  edson_id uuid;
  isaque_id uuid;
BEGIN
  SELECT id INTO edson_id
  FROM auth.users
  WHERE lower(trim(email)) = lower('edson@cedroobras.com');

  SELECT id INTO isaque_id
  FROM auth.users
  WHERE lower(trim(email)) = lower('isaquecabral@cedroobras.com');

  IF edson_id IS NULL THEN
    RAISE EXCEPTION 'Usuário Auth não encontrado: edson@cedroobras.com';
  END IF;

  IF isaque_id IS NULL THEN
    RAISE EXCEPTION 'Usuário Auth não encontrado: isaquecabral@cedroobras.com';
  END IF;

  RAISE NOTICE 'Auth OK — Edson: %, Isaque: %', edson_id, isaque_id;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Edson Junior — administrador
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, nome, role, ativo, funcionario_id)
SELECT
  u.id,
  'Edson Junior',
  'admin',
  true,
  NULL
FROM auth.users u
WHERE lower(trim(u.email)) = lower('edson@cedroobras.com')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo,
  funcionario_id = NULL;

-- ---------------------------------------------------------------------------
-- 2. Isaque Cabral — funcionário (portal de notas)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, nome, role, ativo)
SELECT
  u.id,
  'Isaque Cabral',
  'funcionario',
  true
FROM auth.users u
WHERE lower(trim(u.email)) = lower('isaquecabral@cedroobras.com')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo;

-- ---------------------------------------------------------------------------
-- 3. Vincular Isaque ao cadastro em portal_funcionarios
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET funcionario_id = pf.id
FROM auth.users u,
     public.portal_funcionarios pf
WHERE p.id = u.id
  AND lower(trim(u.email)) = lower('isaquecabral@cedroobras.com')
  AND pf.nome = 'Isaque Cabral'
  AND pf.ativo = true;

-- ---------------------------------------------------------------------------
-- 4. Verificação (resultado esperado: 2 linhas)
-- ---------------------------------------------------------------------------
SELECT
  u.email,
  p.nome,
  p.role,
  p.ativo,
  p.funcionario_id,
  pf.nome AS portal_funcionario_nome,
  p.criado_em
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.portal_funcionarios pf ON pf.id = p.funcionario_id
WHERE lower(trim(u.email)) IN (
  lower('edson@cedroobras.com'),
  lower('isaquecabral@cedroobras.com')
)
ORDER BY p.role DESC, p.nome;
