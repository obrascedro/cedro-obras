-- Engenheiro Cedro — histórico de conversas do assistente inteligente
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.assistente_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text,
  obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assistente_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.assistente_conversas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo text NOT NULL,
  metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent text,
  fonte text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistente_conversas_atualizado
  ON public.assistente_conversas (atualizado_em DESC);

CREATE INDEX IF NOT EXISTS idx_assistente_mensagens_conversa
  ON public.assistente_mensagens (conversa_id, criado_em ASC);

ALTER TABLE public.assistente_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistente_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistente_conversas_select"
  ON public.assistente_conversas FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "assistente_conversas_insert"
  ON public.assistente_conversas FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "assistente_conversas_update"
  ON public.assistente_conversas FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "assistente_conversas_delete"
  ON public.assistente_conversas FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "assistente_mensagens_select"
  ON public.assistente_mensagens FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "assistente_mensagens_insert"
  ON public.assistente_mensagens FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "assistente_mensagens_delete"
  ON public.assistente_mensagens FOR DELETE TO anon, authenticated USING (true);
