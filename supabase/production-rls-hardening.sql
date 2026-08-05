-- Cedro Obras — Endurecimento RLS para produção
-- Execute no SQL Editor do Supabase APÓS:
--   unified-auth.sql, portal-minhas-notas-rls.sql, admin-funcionarios.sql,
--   audit-logs.sql, funcionario-obras.sql
--
-- Corrige: C-01, C-02, C-03, C-07, C-08

-- =============================================================================
-- 1. Funções auxiliares de perfil
-- =============================================================================

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

CREATE OR REPLACE FUNCTION public.is_funcionario_ativo()
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
      AND role = 'funcionario'
      AND ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.meu_funcionario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT funcionario_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'funcionario'
    AND ativo = true
  LIMIT 1;
$$;

-- =============================================================================
-- 2. notas_fiscais — remover anon; admin + funcionário (próprias notas)
-- =============================================================================

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_fiscais_select" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_insert" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_update" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_delete" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_insert_funcionario" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_insert_anon" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_select_anon" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_update_admin" ON public.notas_fiscais;
DROP POLICY IF EXISTS "notas_fiscais_delete_admin" ON public.notas_fiscais;

CREATE POLICY "notas_fiscais_select"
  ON public.notas_fiscais FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR auth_user_id = auth.uid()
  );

CREATE POLICY "notas_fiscais_insert"
  ON public.notas_fiscais FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    OR (
      auth_user_id = auth.uid()
      AND origem = 'portal_funcionario'
      AND funcionario_id = public.meu_funcionario_id()
    )
  );

CREATE POLICY "notas_fiscais_update"
  ON public.notas_fiscais FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "notas_fiscais_delete"
  ON public.notas_fiscais FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

CREATE INDEX IF NOT EXISTS notas_fiscais_status_criado_idx
  ON public.notas_fiscais (status_processamento, criado_em DESC);

-- =============================================================================
-- 3. Storage notas-fiscais — sem anon
-- =============================================================================

DROP POLICY IF EXISTS "notas_fiscais_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "notas_fiscais_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "notas_fiscais_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "notas_fiscais_storage_select_anon" ON storage.objects;

CREATE POLICY "notas_fiscais_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notas-fiscais'
    AND (
      public.is_admin_ativo()
      OR EXISTS (
        SELECT 1
        FROM public.notas_fiscais nf
        WHERE nf.arquivo_path = name
          AND nf.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notas_fiscais_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notas-fiscais'
    AND (public.is_admin_ativo() OR public.is_funcionario_ativo())
  );

CREATE POLICY "notas_fiscais_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notas-fiscais'
    AND public.is_admin_ativo()
  );

-- =============================================================================
-- 4. obras — admin CRUD; funcionário somente leitura (portal)
-- =============================================================================

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obras_select" ON public.obras;
DROP POLICY IF EXISTS "obras_insert" ON public.obras;
DROP POLICY IF EXISTS "obras_update" ON public.obras;
DROP POLICY IF EXISTS "obras_delete" ON public.obras;

CREATE POLICY "obras_select"
  ON public.obras FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo() OR public.is_funcionario_ativo());

CREATE POLICY "obras_insert"
  ON public.obras FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "obras_update"
  ON public.obras FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "obras_delete"
  ON public.obras FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- =============================================================================
-- 5. clientes — somente admin
-- =============================================================================

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

CREATE POLICY "clientes_select"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "clientes_insert"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "clientes_update"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "clientes_delete"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- =============================================================================
-- 6. gastos_obra — somente admin
-- =============================================================================

ALTER TABLE public.gastos_obra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gastos_obra_select" ON public.gastos_obra;
DROP POLICY IF EXISTS "gastos_obra_insert" ON public.gastos_obra;
DROP POLICY IF EXISTS "gastos_obra_update" ON public.gastos_obra;
DROP POLICY IF EXISTS "gastos_obra_delete" ON public.gastos_obra;

CREATE POLICY "gastos_obra_select"
  ON public.gastos_obra FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "gastos_obra_insert"
  ON public.gastos_obra FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "gastos_obra_update"
  ON public.gastos_obra FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "gastos_obra_delete"
  ON public.gastos_obra FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

CREATE INDEX IF NOT EXISTS gastos_obra_obra_id_idx
  ON public.gastos_obra (obra_id);

-- =============================================================================
-- 7. portal_funcionarios — sem anon
-- =============================================================================

ALTER TABLE public.portal_funcionarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_funcionarios_select" ON public.portal_funcionarios;
DROP POLICY IF EXISTS "portal_funcionarios_insert_admin" ON public.portal_funcionarios;
DROP POLICY IF EXISTS "portal_funcionarios_update_admin" ON public.portal_funcionarios;

CREATE POLICY "portal_funcionarios_select"
  ON public.portal_funcionarios FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "portal_funcionarios_insert_admin"
  ON public.portal_funcionarios FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "portal_funcionarios_update_admin"
  ON public.portal_funcionarios FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

-- =============================================================================
-- 8. classificacoes_aprendidas — somente admin autenticado
-- =============================================================================

ALTER TABLE public.classificacoes_aprendidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classificacoes_aprendidas_select" ON public.classificacoes_aprendidas;
DROP POLICY IF EXISTS "classificacoes_aprendidas_insert" ON public.classificacoes_aprendidas;
DROP POLICY IF EXISTS "classificacoes_aprendidas_update" ON public.classificacoes_aprendidas;

CREATE POLICY "classificacoes_aprendidas_select"
  ON public.classificacoes_aprendidas FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "classificacoes_aprendidas_insert"
  ON public.classificacoes_aprendidas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "classificacoes_aprendidas_update"
  ON public.classificacoes_aprendidas FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

-- =============================================================================
-- 9. assistente_conversas / assistente_mensagens — somente admin
-- =============================================================================

ALTER TABLE public.assistente_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistente_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assistente_conversas_select" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_insert" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_update" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_delete" ON public.assistente_conversas;

DROP POLICY IF EXISTS "assistente_mensagens_select" ON public.assistente_mensagens;
DROP POLICY IF EXISTS "assistente_mensagens_insert" ON public.assistente_mensagens;
DROP POLICY IF EXISTS "assistente_mensagens_delete" ON public.assistente_mensagens;

CREATE POLICY "assistente_conversas_select"
  ON public.assistente_conversas FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "assistente_conversas_insert"
  ON public.assistente_conversas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "assistente_conversas_update"
  ON public.assistente_conversas FOR UPDATE
  TO authenticated
  USING (public.is_admin_ativo())
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "assistente_conversas_delete"
  ON public.assistente_conversas FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "assistente_mensagens_select"
  ON public.assistente_mensagens FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "assistente_mensagens_insert"
  ON public.assistente_mensagens FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

CREATE POLICY "assistente_mensagens_delete"
  ON public.assistente_mensagens FOR DELETE
  TO authenticated
  USING (public.is_admin_ativo());

-- =============================================================================
-- 10. notas_fiscais_eventos — somente admin
-- =============================================================================

ALTER TABLE public.notas_fiscais_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_fiscais_eventos_select" ON public.notas_fiscais_eventos;
DROP POLICY IF EXISTS "notas_fiscais_eventos_insert" ON public.notas_fiscais_eventos;

CREATE POLICY "notas_fiscais_eventos_select"
  ON public.notas_fiscais_eventos FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo());

CREATE POLICY "notas_fiscais_eventos_insert"
  ON public.notas_fiscais_eventos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_ativo());

-- Service role (servidor) ignora RLS para WhatsApp, auditoria e jobs internos.

-- =============================================================================
-- 11. Role diretoria (A-02) — leitura financeira, sem CRUD admin
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_diretoria_ativo()
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
      AND role = 'diretoria'
      AND ativo = true
  );
$$;

-- Diretoria: leitura em notas, obras, gastos e clientes
DROP POLICY IF EXISTS "notas_fiscais_select" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_select"
  ON public.notas_fiscais FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR public.is_diretoria_ativo()
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "obras_select" ON public.obras;
CREATE POLICY "obras_select"
  ON public.obras FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    OR public.is_diretoria_ativo()
    OR (
      public.is_funcionario_ativo()
      AND EXISTS (
        SELECT 1
        FROM public.funcionario_obras fo
        WHERE fo.obra_id = obras.id
          AND fo.funcionario_id = public.meu_funcionario_id()
      )
    )
  );

DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo() OR public.is_diretoria_ativo());

DROP POLICY IF EXISTS "gastos_obra_select" ON public.gastos_obra;
CREATE POLICY "gastos_obra_select"
  ON public.gastos_obra FOR SELECT
  TO authenticated
  USING (public.is_admin_ativo() OR public.is_diretoria_ativo());

-- =============================================================================
-- 12. Engenheiro Cedro — ownership por usuário (A-12)
-- =============================================================================

ALTER TABLE public.assistente_conversas
  ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "assistente_conversas_select" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_insert" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_update" ON public.assistente_conversas;
DROP POLICY IF EXISTS "assistente_conversas_delete" ON public.assistente_conversas;

CREATE POLICY "assistente_conversas_select"
  ON public.assistente_conversas FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_conversas_insert"
  ON public.assistente_conversas FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_conversas_update"
  ON public.assistente_conversas FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  )
  WITH CHECK (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

CREATE POLICY "assistente_conversas_delete"
  ON public.assistente_conversas FOR DELETE
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND (usuario_id = auth.uid() OR usuario_id IS NULL)
  );

DROP POLICY IF EXISTS "assistente_mensagens_select" ON public.assistente_mensagens;
DROP POLICY IF EXISTS "assistente_mensagens_insert" ON public.assistente_mensagens;
DROP POLICY IF EXISTS "assistente_mensagens_delete" ON public.assistente_mensagens;

CREATE POLICY "assistente_mensagens_select"
  ON public.assistente_mensagens FOR SELECT
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND EXISTS (
      SELECT 1
      FROM public.assistente_conversas c
      WHERE c.id = conversa_id
        AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
    )
  );

CREATE POLICY "assistente_mensagens_insert"
  ON public.assistente_mensagens FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_ativo()
    AND EXISTS (
      SELECT 1
      FROM public.assistente_conversas c
      WHERE c.id = conversa_id
        AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
    )
  );

CREATE POLICY "assistente_mensagens_delete"
  ON public.assistente_mensagens FOR DELETE
  TO authenticated
  USING (
    public.is_admin_ativo()
    AND EXISTS (
      SELECT 1
      FROM public.assistente_conversas c
      WHERE c.id = conversa_id
        AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
    )
  );

