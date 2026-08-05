-- =============================================================================
-- Cedro Obras — Remover colunas de IA do acompanhamento de obra
-- Idempotente · execute se acompanhamento-obras-ia.sql foi aplicado antes
-- Mantém observacao_funcionario (texto do funcionário)
-- =============================================================================

DROP INDEX IF EXISTS public.acompanhamento_obras_status_analise_ia_idx;

ALTER TABLE public.acompanhamento_obras
  DROP COLUMN IF EXISTS descricao_ia;

ALTER TABLE public.acompanhamento_obras
  DROP COLUMN IF EXISTS status_analise_ia;

ALTER TABLE public.acompanhamento_obras
  DROP COLUMN IF EXISTS analisado_em;

ALTER TABLE public.acompanhamento_obras
  DROP COLUMN IF EXISTS erro_analise_ia;

ALTER TABLE public.acompanhamento_obras
  DROP COLUMN IF EXISTS modelo_ia;

-- Verificação
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'acompanhamento_obras'
  AND column_name IN (
    'descricao_ia',
    'status_analise_ia',
    'analisado_em',
    'erro_analise_ia',
    'modelo_ia'
  );
