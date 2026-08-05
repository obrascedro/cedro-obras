-- =============================================================================
-- Cedro Obras — Reconciliar profiles.id com auth.users.id (Edson + Isaque)
-- Idempotente · seguro · não altera Auth · não desativa RLS
--
-- Problema: profiles existem, mas profiles.id ≠ auth.users.id para o mesmo e-mail.
-- Solução: remove apenas perfis órfãos desses dois e-mails e recria/atualiza
--          com id = auth.users.id.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Validar usuários Auth (aborta se faltar algum)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  edson_auth_id uuid;
  isaque_auth_id uuid;
BEGIN
  SELECT id INTO edson_auth_id
  FROM auth.users
  WHERE lower(trim(email)) = 'edson@cedroobras.com';

  SELECT id INTO isaque_auth_id
  FROM auth.users
  WHERE lower(trim(email)) = 'isaquecabral@cedroobras.com';

  IF edson_auth_id IS NULL THEN
    RAISE EXCEPTION 'auth.users não encontrado: edson@cedroobras.com';
  END IF;

  IF isaque_auth_id IS NULL THEN
    RAISE EXCEPTION 'auth.users não encontrado: isaquecabral@cedroobras.com';
  END IF;

  RAISE NOTICE 'auth.users OK — Edson: %, Isaque: %', edson_auth_id, isaque_auth_id;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Remover profiles órfãos (id ∉ auth.users) só para Edson / Isaque
--    Critérios: e-mail ou nome correspondente; não afeta outros usuários.
-- ---------------------------------------------------------------------------
DELETE FROM public.profiles p
WHERE p.id NOT IN (SELECT id FROM auth.users)
  AND (
    lower(trim(COALESCE(p.email, ''))) IN (
      'edson@cedroobras.com',
      'isaquecabral@cedroobras.com'
    )
    OR lower(trim(p.nome)) IN ('edson junior', 'isaque cabral')
  );

-- Perfis com id errado mas mesmo e-mail que um auth.user (duplicata por e-mail)
DELETE FROM public.profiles p
USING auth.users u
WHERE lower(trim(u.email)) IN ('edson@cedroobras.com', 'isaquecabral@cedroobras.com')
  AND p.id <> u.id
  AND (
    lower(trim(COALESCE(p.email, ''))) = lower(trim(u.email))
    OR (
      p.email IS NULL
      AND lower(trim(p.nome)) = CASE lower(trim(u.email))
        WHEN 'edson@cedroobras.com' THEN 'edson junior'
        WHEN 'isaquecabral@cedroobras.com' THEN 'isaque cabral'
      END
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Upsert profiles com id = auth.users.id (obrigatório)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, nome, role, ativo, email, funcionario_id)
SELECT
  u.id,
  'Edson Junior',
  'admin',
  true,
  lower(trim(u.email)),
  NULL
FROM auth.users u
WHERE lower(trim(u.email)) = 'edson@cedroobras.com'
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo,
  email = EXCLUDED.email,
  funcionario_id = NULL;

INSERT INTO public.profiles (id, nome, role, ativo, email)
SELECT
  u.id,
  'Isaque Cabral',
  'funcionario',
  true,
  lower(trim(u.email))
FROM auth.users u
WHERE lower(trim(u.email)) = 'isaquecabral@cedroobras.com'
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo,
  email = EXCLUDED.email;

-- ---------------------------------------------------------------------------
-- 4. Vincular Isaque → portal_funcionarios (obrigatório para o portal)
--    Edson admin: funcionario_id permanece NULL (arquitetura atual)
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET funcionario_id = pf.id
FROM auth.users u,
     public.portal_funcionarios pf
WHERE p.id = u.id
  AND lower(trim(u.email)) = 'isaquecabral@cedroobras.com'
  AND pf.nome = 'Isaque Cabral'
  AND pf.ativo = true;

-- Garantir Edson sem vínculo de funcionário
UPDATE public.profiles p
SET funcionario_id = NULL
FROM auth.users u
WHERE p.id = u.id
  AND lower(trim(u.email)) = 'edson@cedroobras.com';

COMMIT;

-- ---------------------------------------------------------------------------
-- 5. Verificação detalhada
-- ---------------------------------------------------------------------------
SELECT
  u.email,
  u.id AS auth_user_id,
  p.id AS profile_id,
  (u.id = p.id) AS ids_correspondem,
  p.nome,
  p.role,
  p.ativo,
  p.funcionario_id,
  pf.nome AS portal_funcionario_nome
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.portal_funcionarios pf ON pf.id = p.funcionario_id
WHERE lower(trim(u.email)) IN ('edson@cedroobras.com', 'isaquecabral@cedroobras.com')
ORDER BY u.email;

-- ---------------------------------------------------------------------------
-- 6. Contagens (auth_com_profile deve ser 2)
-- ---------------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.profiles) AS profiles_total,
  (SELECT count(*)
   FROM auth.users u
   WHERE EXISTS (
     SELECT 1 FROM public.profiles p WHERE p.id = u.id
   )) AS auth_com_profile,
  (SELECT count(*)
   FROM auth.users u
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profiles p WHERE p.id = u.id
   )) AS auth_sem_profile;
