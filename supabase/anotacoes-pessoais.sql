-- Cedro Obras — Anotações pessoais (admin, isolado de obras/financeiro)
-- Execute no SQL Editor do Supabase

-- 1. Tabela
CREATE TABLE IF NOT EXISTS public.anotacoes_pessoais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text NOT NULL,
  categoria text,
  valor numeric(15, 2),
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anotacoes_pessoais_user_data_idx
  ON public.anotacoes_pessoais (user_id, data DESC);

CREATE INDEX IF NOT EXISTS anotacoes_pessoais_user_criado_idx
  ON public.anotacoes_pessoais (user_id, criado_em DESC);

-- 2. Trigger atualizado_em
CREATE OR REPLACE FUNCTION public.set_anotacoes_pessoais_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS anotacoes_pessoais_atualizado_em ON public.anotacoes_pessoais;

CREATE TRIGGER anotacoes_pessoais_atualizado_em
  BEFORE UPDATE ON public.anotacoes_pessoais
  FOR EACH ROW
  EXECUTE FUNCTION public.set_anotacoes_pessoais_atualizado_em();

-- 3. Função auxiliar (pode já existir)
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

-- 4. RLS — admin autenticado vê/edita somente suas próprias anotações
ALTER TABLE public.anotacoes_pessoais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anotacoes_pessoais_select" ON public.anotacoes_pessoais;
CREATE POLICY "anotacoes_pessoais_select"
  ON public.anotacoes_pessoais FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo() AND user_id = auth.uid());

DROP POLICY IF EXISTS "anotacoes_pessoais_insert" ON public.anotacoes_pessoais;
CREATE POLICY "anotacoes_pessoais_insert"
  ON public.anotacoes_pessoais FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo() AND user_id = auth.uid());

DROP POLICY IF EXISTS "anotacoes_pessoais_update" ON public.anotacoes_pessoais;
CREATE POLICY "anotacoes_pessoais_update"
  ON public.anotacoes_pessoais FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo() AND user_id = auth.uid())
  WITH CHECK (public.is_admin_ativo() AND user_id = auth.uid());

DROP POLICY IF EXISTS "anotacoes_pessoais_delete" ON public.anotacoes_pessoais;
CREATE POLICY "anotacoes_pessoais_delete"
  ON public.anotacoes_pessoais FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo() AND user_id = auth.uid());
