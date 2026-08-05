-- Política UPDATE para notas_fiscais (status e dados após leitura IA)
-- Execute no SQL Editor do Supabase se ainda não existir.

DROP POLICY IF EXISTS "notas_fiscais_update" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_update"
  ON public.notas_fiscais FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
