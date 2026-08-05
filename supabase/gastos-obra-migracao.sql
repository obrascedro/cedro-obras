-- =============================================================================
-- Cedro Obras — Gastos: origem, ativo e migração de saldo histórico
-- Idempotente · execute no SQL Editor do Supabase
-- =============================================================================

ALTER TABLE public.gastos_obra
  ADD COLUMN IF NOT EXISTS origem text NULL DEFAULT 'manual';

ALTER TABLE public.gastos_obra
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS gastos_obra_obra_ativo_idx
  ON public.gastos_obra (obra_id)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS gastos_obra_origem_idx
  ON public.gastos_obra (origem)
  WHERE origem = 'migracao';

-- Migrar saldo legado de obras.gasto_realizado → lançamento em gastos_obra
-- (somente quando não há gastos ativos e ainda não existe registro de migração)
INSERT INTO public.gastos_obra (
  obra_id,
  etapa,
  categoria,
  descricao,
  quantidade,
  valor_unitario,
  valor_total,
  fornecedor,
  data_gasto,
  origem,
  ativo
)
SELECT
  o.id,
  'Geral',
  'Histórico/Migração',
  'Gastos históricos anteriores à implantação do sistema',
  1,
  o.gasto_realizado,
  o.gasto_realizado,
  NULL,
  COALESCE(o.data_inicio, CURRENT_DATE),
  'migracao',
  true
FROM public.obras o
WHERE o.gasto_realizado IS NOT NULL
  AND o.gasto_realizado > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.gastos_obra g
    WHERE g.obra_id = o.id
      AND g.origem = 'migracao'
  )
  AND COALESCE(
    (
      SELECT SUM(g2.valor_total)
      FROM public.gastos_obra g2
      WHERE g2.obra_id = o.id
        AND g2.ativo = true
    ),
    0
  ) < o.gasto_realizado - 0.005;

-- Sincronizar campos legados em obras (cache derivado — não usar como fonte na UI)
UPDATE public.obras o
SET
  gasto_realizado = agg.total_gasto,
  lucro_estimado = COALESCE(o.valor_recebido, 0) - agg.total_gasto
FROM (
  SELECT
    g.obra_id,
    COALESCE(SUM(g.valor_total), 0) AS total_gasto
  FROM public.gastos_obra g
  WHERE g.ativo = true
  GROUP BY g.obra_id
) agg
WHERE o.id = agg.obra_id;

-- Obras sem gastos ativos: zerar gasto_realizado legado inconsistente
UPDATE public.obras o
SET
  gasto_realizado = 0,
  lucro_estimado = COALESCE(o.valor_recebido, 0)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.gastos_obra g
  WHERE g.obra_id = o.id
    AND g.ativo = true
)
AND COALESCE(o.gasto_realizado, 0) <> 0;

-- Verificação: obras com divergência entre legado e soma de gastos
SELECT
  o.nome,
  o.gasto_realizado AS legado_obras,
  COALESCE(SUM(g.valor_total) FILTER (WHERE g.ativo = true), 0) AS soma_gastos,
  o.gasto_realizado - COALESCE(SUM(g.valor_total) FILTER (WHERE g.ativo = true), 0) AS diferenca
FROM public.obras o
LEFT JOIN public.gastos_obra g ON g.obra_id = o.id
GROUP BY o.id, o.nome, o.gasto_realizado
HAVING ABS(
  o.gasto_realizado - COALESCE(SUM(g.valor_total) FILTER (WHERE g.ativo = true), 0)
) > 0.01
ORDER BY o.nome;
