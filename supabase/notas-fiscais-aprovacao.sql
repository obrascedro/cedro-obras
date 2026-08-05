-- Cedro Obras — fluxo de aprovação de notas fiscais (não destrutivo)
-- Execute no SQL Editor do Supabase

-- 1. Novas colunas em notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS enviado_por text,
  ADD COLUMN IF NOT EXISTS enviado_por_nome text,
  ADD COLUMN IF NOT EXISTS aprovado_por text,
  ADD COLUMN IF NOT EXISTS aprovado_por_nome text,
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS rejeitado_por text,
  ADD COLUMN IF NOT EXISTS rejeitado_por_nome text,
  ADD COLUMN IF NOT EXISTS rejeitado_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS mensagem_correcao text,
  ADD COLUMN IF NOT EXISTS leitura_json jsonb,
  ADD COLUMN IF NOT EXISTS itens_json jsonb;

-- 2. Migrar status legados (preserva dados)
UPDATE public.notas_fiscais
SET status_processamento = 'aprovada'
WHERE status_processamento = 'confirmado';

UPDATE public.notas_fiscais
SET status_processamento = 'pendente_aprovacao'
WHERE status_processamento IN ('revisar', 'processado');

-- 3. Índice para pendências
CREATE INDEX IF NOT EXISTS notas_fiscais_status_idx
  ON public.notas_fiscais (status_processamento);

-- 4. Histórico de eventos
CREATE TABLE IF NOT EXISTS public.notas_fiscais_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id uuid NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  acao text NOT NULL,
  usuario_id text,
  usuario_nome text,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notas_fiscais_eventos_nota_idx
  ON public.notas_fiscais_eventos (nota_id, criado_em DESC);

ALTER TABLE public.notas_fiscais_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_fiscais_eventos_select" ON public.notas_fiscais_eventos;
CREATE POLICY "notas_fiscais_eventos_select"
  ON public.notas_fiscais_eventos FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "notas_fiscais_eventos_insert" ON public.notas_fiscais_eventos;
CREATE POLICY "notas_fiscais_eventos_insert"
  ON public.notas_fiscais_eventos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
