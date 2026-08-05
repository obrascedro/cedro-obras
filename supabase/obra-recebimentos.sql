-- =============================================================================
-- Cedro Obras — Recebimentos por obra (histórico)
-- Idempotente · execute no SQL Editor do Supabase
-- Pré-requisito: is_admin_ativo() (production-rls-hardening.sql ou unified-auth)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.obra_recebimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  valor numeric(14, 2) NOT NULL CHECK (valor >= 0),
  data_recebimento date NOT NULL,
  descricao text NULL,
  origem text NULL DEFAULT 'manual',
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS obra_recebimentos_obra_id_idx
  ON public.obra_recebimentos (obra_id);

CREATE INDEX IF NOT EXISTS obra_recebimentos_data_idx
  ON public.obra_recebimentos (data_recebimento DESC);

-- Migrar saldo histórico (sem duplicar)
INSERT INTO public.obra_recebimentos (
  obra_id,
  valor,
  data_recebimento,
  descricao,
  origem,
  criado_em
)
SELECT
  o.id,
  o.valor_recebido,
  COALESCE(o.data_inicio, CURRENT_DATE),
  'Saldo histórico anterior à implantação do controle de recebimentos',
  'migracao',
  now()
FROM public.obras o
WHERE o.valor_recebido IS NOT NULL
  AND o.valor_recebido > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.obra_recebimentos r
    WHERE r.obra_id = o.id
      AND r.origem = 'migracao'
  );

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.obra_recebimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obra_recebimentos_select" ON public.obra_recebimentos;
DROP POLICY IF EXISTS "obra_recebimentos_insert" ON public.obra_recebimentos;
DROP POLICY IF EXISTS "obra_recebimentos_update" ON public.obra_recebimentos;
DROP POLICY IF EXISTS "obra_recebimentos_delete" ON public.obra_recebimentos;

CREATE POLICY "obra_recebimentos_select"
  ON public.obra_recebimentos FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "obra_recebimentos_insert"
  ON public.obra_recebimentos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "obra_recebimentos_update"
  ON public.obra_recebimentos FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "obra_recebimentos_delete"
  ON public.obra_recebimentos FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- Verificação
SELECT count(*) AS total_recebimentos FROM public.obra_recebimentos;

SELECT origem, count(*) AS qtd, sum(valor) AS total
FROM public.obra_recebimentos
GROUP BY origem
ORDER BY origem;
