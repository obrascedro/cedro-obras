-- Cedro Obras — funcionários autorizados no Portal de Notas (não destrutivo)
-- Execute no SQL Editor do Supabase

-- 1. Tabela de funcionários
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

-- 2. RLS — leitura pública anon (lista de nomes no login); sem senha na tabela
ALTER TABLE public.portal_funcionarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_funcionarios_select" ON public.portal_funcionarios;
CREATE POLICY "portal_funcionarios_select"
  ON public.portal_funcionarios FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- 3. Vínculo opcional em notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS funcionario_id uuid REFERENCES public.portal_funcionarios(id);

CREATE INDEX IF NOT EXISTS notas_fiscais_funcionario_id_idx
  ON public.notas_fiscais (funcionario_id);

-- 4. Cadastro inicial
INSERT INTO public.portal_funcionarios (nome, ativo)
VALUES
  ('Isaque Cabral', true),
  ('Edson Junior', true)
ON CONFLICT (nome) DO UPDATE SET ativo = EXCLUDED.ativo;
