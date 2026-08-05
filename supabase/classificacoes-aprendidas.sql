-- Classificações aprendidas a partir de correções do usuário
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS public.classificacoes_aprendidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termo_chave text NOT NULL UNIQUE,
  descricao_exemplo text NOT NULL,
  categoria text NOT NULL,
  etapa text NOT NULL,
  origem text NOT NULL DEFAULT 'usuario',
  uso_count integer NOT NULL DEFAULT 1,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classificacoes_aprendidas_termo_idx
  ON public.classificacoes_aprendidas (termo_chave);

ALTER TABLE public.classificacoes_aprendidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classificacoes_aprendidas_select" ON public.classificacoes_aprendidas;
CREATE POLICY "classificacoes_aprendidas_select"
  ON public.classificacoes_aprendidas FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "classificacoes_aprendidas_insert" ON public.classificacoes_aprendidas;
CREATE POLICY "classificacoes_aprendidas_insert"
  ON public.classificacoes_aprendidas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "classificacoes_aprendidas_update" ON public.classificacoes_aprendidas;
CREATE POLICY "classificacoes_aprendidas_update"
  ON public.classificacoes_aprendidas FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
