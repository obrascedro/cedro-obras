-- Cedro Obras — módulo Notas Fiscais
-- Execute este script no SQL Editor do Supabase (não é destrutivo).

-- 1. Tabela
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  arquivo_path text NOT NULL,
  arquivo_nome text NOT NULL,
  arquivo_tipo text,
  arquivo_tamanho bigint,
  fornecedor text,
  data_nota date,
  valor_total numeric(14, 2),
  observacoes text,
  origem text NOT NULL DEFAULT 'manual',
  status_processamento text NOT NULL DEFAULT 'aguardando',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notas_fiscais_obra_id_idx ON public.notas_fiscais (obra_id);
CREATE INDEX IF NOT EXISTS notas_fiscais_criado_em_idx ON public.notas_fiscais (criado_em DESC);

-- 2. RLS da tabela
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_fiscais_select" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_select"
  ON public.notas_fiscais FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "notas_fiscais_insert" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_insert"
  ON public.notas_fiscais FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "notas_fiscais_delete" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_delete"
  ON public.notas_fiscais FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "notas_fiscais_update" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_update"
  ON public.notas_fiscais FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Bucket privado de Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais', 'notas-fiscais', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 4. Políticas do Storage (bucket privado)
DROP POLICY IF EXISTS "notas_fiscais_storage_select" ON storage.objects;
CREATE POLICY "notas_fiscais_storage_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'notas-fiscais');

DROP POLICY IF EXISTS "notas_fiscais_storage_insert" ON storage.objects;
CREATE POLICY "notas_fiscais_storage_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'notas-fiscais');

DROP POLICY IF EXISTS "notas_fiscais_storage_delete" ON storage.objects;
CREATE POLICY "notas_fiscais_storage_delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'notas-fiscais');
